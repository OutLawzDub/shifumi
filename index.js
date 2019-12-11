var http    = require('http');
var server  = http.createServer();
var io      = require('socket.io').listen(server);

// Configuration

/**
 * Game Etat Instructions
 * 0 = none
 * 1 = waiting users
 * 2 = started
 */

const gameInfo = {
    etat: 0,
    winner: false
};

/**
 * Instructions Game Configuration
 * All time asked = milliseconds
 * 
 * timeBeforePlaying : delay for user to join starting game
 * timeToCHoose : delay for user choosing rock paper or cissors
 */

const configuration = {
    timeBeforePlaying: 10000,
    timeToChoose: 5000,
    limitUser: 4
};

// Functions

var actualTimer = 0;

function startTimer()
{
    actualTimer = configuration.timeBeforePlaying;

    setInterval(() => {
        if(actualTimer != 0)
        {
            actualTimer = actualTimer - 1000;

            io.emit('timer', actualTimer);
        }
    }, 1000);

    setTimeout(() => {
        gameInfo.etat = 2;
        startChecker();
    }, configuration.timeBeforePlaying);
}

function addPlayer(id, socket)
{
    var player = {
        id: id,
        level: 0,
        playing: false,
        socket: socket
    };

    players.push(player);
}

function getRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

var intervalChecker;

function startChecker()
{
    intervalChecker = setInterval(function() {

        io.emit('nb_players', players.length);

        // Attribution entre joueurs.

        if(players.length != 0)
        {
            let notPlaying = players.filter(elem => elem.playing === false);

            for (let i = 0; i < notPlaying.length; i++)
            {
                const id = notPlaying[i].id;

                const freshInfo = players.find(elem => elem.id === id);
                const playing   = freshInfo.playing;
                const level     = freshInfo.level;

                if(playing === false)
                {
                    let correspond = players.filter(elem => elem.level === level && elem.id !== id && elem.playing === false);

                    if(correspond.length > 0)
                    {
                        let joueur = correspond[getRandomInt(correspond.length)];

                        joueur.playing        = true;
                        notPlaying[i].playing = true;

                        let player1 = joueur;
                        let player2 = notPlaying[i];

                        let actual = new Date();
                            actual = actual.getTime();

                        let random = getRandomInt(999999);

                        var game = {
                            start: actual,
                            player1: player1,
                            player2: player2,
                            choose1: false,
                            choose2: false,
                            session: random,
                            winner: false,
                            finish: false
                        };

                        // On connecte les deux participants à la même session.

                        joueur.socket.join(random);
                        notPlaying[i].socket.join(random);

                        games.push(game);

                        io.to(player1.id).emit('start', {game: true});
                        io.to(player2.id).emit('start', {game: true});
                    }
                    else
                    {
                        if(players.length == 1)
                        {
                            let joueur = players[0];

                            players = [];

                            gameInfo.winner = joueur;

                            io.to(joueur.id).emit('winner', true);
                        }
                        else
                        {
                            let playing = players.filter(elem => elem.playing === true && elem.level === level);

                            if(playing.length === (players.length - 1))
                            {  
                                notPlaying[i].playing = true;

                                let player2 = notPlaying[i];

                                let actual = new Date();
                                    actual = actual.getTime();

                                let random = getRandomInt(999999);

                                var game = {
                                    start: actual,
                                    player1: 'ia',
                                    player2: player2,
                                    choose1: false,
                                    choose2: false,
                                    session: random,
                                    winner: false,
                                    finish: false
                                };

                                // On connecte les deux participants à la même session.

                                notPlaying[i].socket.join(random);

                                games.push(game);

                                io.to(player2.id).emit('start', {game: true});

                                console.log('just solo ok for ia');
                            }
                            else
                            {
                                console.log('solo but waitigin friends =)');
                            }
                        }
                    }
                }
            }
        }
        else
        {
            if(gameInfo.winner === false)
            {
                console.log('full draw');
            }
        }

        // Vérification jeux.

        let gamesUp = games.filter(elem => elem.finish === false);

        if(gamesUp.length != 0)
        {
            for (let i = 0; i < gamesUp.length; i++)
            {
                const element = gamesUp[i];
                const start   = element.start;
                const player1 = element.player1;
                const player2 = element.player2;
                const choose1 = element.choose1;
                const choose2 = element.choose2;
                const session = element.session;
                const finish  = element.finish;

                let checkPlayer1 = players.findIndex(elem => elem.id === player1.id);
                let checkPlayer2 = players.findIndex(elem => elem.id === player2.id);

                if((checkPlayer1 !== -1 && checkPlayer2 !== -1) || (checkPlayer2 !== -1 && player1 == 'ia'))
                {

                    if (checkPlayer2 !== -1 && player1 == 'ia')
                    {
                        console.log(gamesUp[i]);
                    }

                    // Check time left

                    let dateNow = new Date();
                        dateNow = dateNow.getTime();

                    let calcul  = (dateNow - start);

                    if(calcul <= configuration.timeToChoose)
                    {
                        // Encore dans les temps.

                        io.to(session).emit('timer_choose', (configuration.timeToChoose - calcul));
                    }
                    else
                    {
                        // Partie terminé - temps ecoulé.

                        if(choose1 !== false && choose2 !== false)
                        {
                            io.to(session).emit('terminus', {player1: player1.id, choose1: choose1, player2: player2.id, choose2: choose2});

                            let winner, loser;

                            if(choose1 === choose2)
                            {
                                winner = false;
                                loser  = true;
                            }
                            else
                            {
                                if(choose1 == 'pierre')
                                {
                                    if(choose2 == 'ciseaux')
                                    {
                                        winner = player1;
                                        loser  = player2;
                                    }

                                    if(choose2 == 'feuille')
                                    {
                                        winner = player2;
                                        loser  = player1;
                                    }
                                }

                                if(choose1 == 'feuille')
                                {
                                    if(choose2 == 'pierre')
                                    {
                                        winner = player1;
                                        loser  = player2;
                                    }

                                    if(choose2 == 'ciseaux')
                                    {
                                        winner = player2;
                                        loser  = player1;
                                    }
                                }

                                if(choose1 == 'ciseaux')
                                {
                                    if(choose2 == 'pierre')
                                    {
                                        winner = player2;
                                        loser  = player1;
                                    }

                                    if(choose2 == 'feuille')
                                    {
                                        winner = player1;
                                        loser  = player2;
                                    }
                                }
                            }

                            if(checkPlayer2 !== -1 && player1 == 'ia')
                            {
                                let thisGame = games.findIndex(elem => elem.session === session);

                                games[thisGame].finish = true;

                                if(winner === false)
                                {
                                    io.to(session).emit('draw', true);

                                    let findPlayer2 = players.findIndex(elem => elem.id === player2.id);

                                    setTimeout(() => {
                                        io.to(player2.id).emit('next_game');
                                    }, 3000);

                                    players.splice(findPlayer2, 1);
                                }
                                else if(winner === 'ia')
                                {
                                    setTimeout(() => {
                                        io.to(loser.id).emit('next_game');
                                    }, 3000);

                                    let findLoser = players.findIndex(elem => elem.id === loser.id);

                                    players.splice(findLoser, 1);

                                    io.to(loser.id).emit('lose', true);
                                }
                                else if(winner === player2)
                                {
                                    setTimeout(() => {
                                        io.to(winner.id).emit('game_waiting');
                                    }, 3000);

                                    setTimeout(() => {
                                        io.to(winner.id).emit('reset_game', true);

                                        let findWinner = players.findIndex(elem => elem.id === winner.id);

                                        players[findWinner].level   = (players[findWinner].level + 1);
                                        players[findWinner].playing = false;
                                    }, 5000);

                                    io.to(winner.id).emit('win', true);
                                }
                            }
                            else
                            {
                                let thisGame = games.findIndex(elem => elem.session === session);

                                games[thisGame].finish = true;

                                if(winner === false)
                                {
                                    io.to(session).emit('draw', true);

                                    let findPlayer1 = players.findIndex(elem => elem.id === player1.id);
                                    let findPlayer2 = players.findIndex(elem => elem.id === player2.id);

                                    setTimeout(() => {
                                        io.to(player1.id).emit('next_game');
                                        io.to(player2.id).emit('next_game');
                                    }, 3000);

                                    players.splice(findPlayer1, 1);
                                    players.splice(findPlayer2, 1);

                                }
                                else
                                {
                                    setTimeout(() => {
                                        io.to(winner.id).emit('game_waiting');
                                        io.to(loser.id).emit('next_game');
                                    }, 3000);

                                    setTimeout(() => {
                                        io.to(winner.id).emit('reset_game', true);

                                        let findWinner = players.findIndex(elem => elem.id === winner.id);

                                        players[findWinner].level   = (players[findWinner].level + 1);
                                        players[findWinner].playing = false;
                                    }, 5000);

                                    let findLoser = players.findIndex(elem => elem.id === loser.id);

                                    players.splice(findLoser, 1);

                                    io.to(winner.id).emit('win', true);
                                    io.to(loser.id).emit('lose', true);
                                }
                            }
                        }
                        else
                        {
                            if(checkPlayer2 !== -1 && player1 == 'ia')
                            {
                                if(choose1 === false && choose2 !== false)
                                {
                                    let randomChoix = ['pierre', 'feuille', 'ciseaux']
                                    let actualGame  = games.findIndex(elem => elem.session === session);

                                    games[actualGame].choose1 = randomChoix[getRandomInt(randomChoix.length)];
                                }
                                else
                                {
                                    io.to(session).emit('hide_timer_choose', true);
                                }
                            }
                            else
                            {
                                io.to(session).emit('hide_timer_choose', true);
                            }
                        }
                    }
                    
                }
                else
                {
                    let thisGame = games.findIndex(elem => elem.session === session);

                    games[thisGame].finish = true;

                    if(checkPlayer1 === -1)
                    {
                        if(players[checkPlayer2])
                        {
                            players[checkPlayer2].socket.emit('user_left', true);
                            games[thisGame].winner = players[checkPlayer2].id;
                        }

                        setTimeout(() => {
                            if(players[checkPlayer2])
                            {
                                players[checkPlayer2].playing = false;
                                players[checkPlayer2].level   = (players[checkPlayer2].level + 1);
                            }
                        }, 2500);
                    }

                    if(checkPlayer2 === -1)
                    {
                        if(players[checkPlayer1])
                        {
                            players[checkPlayer1].socket.emit('user_left', true);
                            games[thisGame].winner = players[checkPlayer1].id;
                        }

                        setTimeout(() => {
                            if(players[checkPlayer1])
                            {
                                players[checkPlayer1].level   = (players[checkPlayer1].level + 1);
                                players[checkPlayer1].playing = false;
                            }
                        }, 2500);
                    }

                    
                }
            }
        }

    }, 1000);
}

// End function

var players = [];
var games   = [];

io.sockets.on('connection', function (socket) {
    socket.emit('ready', {valid: true});

    let max = players.length === configuration.limitUser;

    if(!max)
    {
        switch (gameInfo.etat) {
            case 0:
                gameInfo.etat = 1;
                startTimer();
                addPlayer(socket.id, socket);
                socket.emit('game_waiting', {waiting: true});
                break;
            case 1:
                addPlayer(socket.id, socket);
                socket.emit('game_waiting', {waiting: true});
                break;
            case 2:
                socket.emit('game_started', {playing: true});
                break;
        }
    
        // Réception d'un message.
    
        socket.on('debug', function(message) {
            console.log(players);
            console.log(games);
        })

        socket.on('choice', function(choix) {
            
            if(choix === null)
            {
                let randomChoix = ['pierre', 'feuille', 'ciseaux']

                choix = randomChoix[getRandomInt(randomChoix.length)];
            }

            let findGame = games.findIndex(elem => elem.finish === false && (elem.player1.id === socket.id || elem.player2.id === socket.id));

            if(findGame !== -1)
            {
                let player1 = games[findGame].player1;
                let player2 = games[findGame].player2;
                let session = games[findGame].session;

                if(player1.id === socket.id)
                {
                    games[findGame].choose1 = choix;
                }

                if(player2.id === socket.id)
                {
                    games[findGame].choose2 = choix;
                }
            }
        })

        socket.on('disconnect', function () {
            var find = players.findIndex(elem => elem.id === socket.id);
            
            console.log(socket.id + ' has disconnect');
            players.splice(find, 1);
        });
    }
    else
    {
        socket.emit('too_many', true);
        socket.disconnect();
    }
    
});


server.listen(8080)