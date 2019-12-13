var http   = require('http');
var server = http.createServer();
var io     = require('socket.io').listen(server);
var ws     = require('websocket').client

var reconnectInterval = 5000;
var client, ready;

var idPartie = getRandomInt(50000);

var intervalRetry = false;

function connect()
{
    var W3CWebSocket = require('websocket').w3cwebsocket;
    
    client = new W3CWebSocket('ws://localhost:1880/shifumi');
    ready  = false;

    client.onerror = function() {
        console.log('Connection Error');
    };
    
    client.onopen = function() {
        console.log('WebSocket Client Connected');

        client.send(JSON.stringify({'qrcode': idPartie}));
        ready = true;
    };
    
    client.onclose = function() {
        console.log('echo-protocol Client Closed');
        setTimeout(connect, reconnectInterval);
        ready = false;
    };
}

connect();

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
    limitUser: 50,
    limitMin: 2
};

// Functions

var actualTimer = 0;

function startTimer()
{
    actualTimer = configuration.timeBeforePlaying;

    var intervalTimer = setInterval(() => {
        if(actualTimer != 0)
        {
            actualTimer = actualTimer - 1000;

            client.send(JSON.stringify({'timer': actualTimer}));
            io.emit('timer', actualTimer);
        }
    }, 1000);

    setTimeout(() => {
        gameInfo.etat = 2;
        startChecker();
        clearInterval(intervalTimer);
    }, (configuration.timeBeforePlaying + 500));
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

function restartGame()
{
    games   = [];

    idPartie = getRandomInt(50000);

    gameInfo.etat   = 0;
    gameInfo.winner = false;

    client.send(JSON.stringify({'qrcode': idPartie}));
}

function getRandomInt(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

let niveau = 0;

// var intervalChecker = false;

function startChecker()
{
    if(players.length <= configuration.limitMin)
    {
        client.send('no_player');
        
        setTimeout(() => {
            restartGame();
        }, 3000);

        return;
    }

    var intervalChecker = setInterval(function() {
        
        client.send(JSON.stringify({'players': players.length}));
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

                        client.send(JSON.stringify({'level': level}));

                        joueur.playing        = true;
                        notPlaying[i].playing = true;

                        let player1 = joueur;
                        let player2 = notPlaying[i];

                        let actual = new Date();
                            actual = actual.getTime();

                        let random = getRandomInt(999999);

                        var game;

                        if(players.length == 2)
                        {
                            game = {
                                start: actual,
                                player1: player1,
                                player2: player2,
                                choose1: false,
                                choose2: false,
                                session: random,
                                winner: false,
                                finish: false,
                                final: true
                            };
                        }
                        else
                        {
                            game = {
                                start: actual,
                                player1: player1,
                                player2: player2,
                                choose1: false,
                                choose2: false,
                                session: random,
                                winner: false,
                                finish: false
                            };
                        }

                        // On connecte les deux participants à la même session.

                        joueur.socket.join(random);
                        notPlaying[i].socket.join(random);

                        games.push(game);

                        client.send(JSON.stringify({'start': true}));

                        io.to(player1.id).emit('start', {game: true});
                        io.to(player2.id).emit('start', {game: true});
                    }
                    else
                    {
                        if(players.length == 1)
                        {
                            let joueur = players[0];

                            players = [];

                            let colors  = ['#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#d35400'];
                            let randCol = colors[getRandomInt(colors.length - 1)]

                            client.send(JSON.stringify({'winner': joueur.id, 'color': randCol}));

                            gameInfo.winner = joueur;
                            gameInfo.etat = 0;

                            setTimeout(() => {
                                restartGame();
                            }, 15000);

                            clearInterval(intervalChecker);

                            io.emit('refresh_page', true);

                            io.to(joueur.id).emit('winner', true);
                            io.to(joueur.id).emit('color', randCol);
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

                                client.send(JSON.stringify({'start': true}));
                                io.to(player2.id).emit('start', {game: true});

                                console.log('just solo ok for ia');
                            }
                            else
                            {
                                console.log('solo but waiting friends =)');
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
                gameInfo.etat = 0;

                let findFinal = games.find(elem => elem.final === true);

                let joueur1  = findFinal.player1.id;
                let joueur2  = findFinal.player2.id;
                
                let colors  = ['#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#d35400'];

                let rand1    = getRandomInt(colors.length - 1);
                let randCol1 = colors[rand1];

                let randCol2;

                if(rand1 === 0)
                {
                    randCol2 = colors[(rand1 + 1)];
                }
                else if(rand1 === (colors.length - 1))
                {
                    randCol2 = colors[(rand1 - 1)];
                }
                else
                {
                    randCol2 = colors[(rand1 - 1)];
                }


                io.to(joueur1).emit('color', randCol1);
                io.to(joueur2).emit('color', randCol2);

                client.send(JSON.stringify({'draw': true, 'color1': randCol1, 'color2': randCol2}));

                setTimeout(() => {
                    restartGame();
                }, 15000);

                clearInterval(intervalChecker);
                
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

                var final = false;

                if(element.final === true)
                {
                    final = true;
                }

                let checkPlayer1 = players.findIndex(elem => elem.id === player1.id);
                let checkPlayer2 = players.findIndex(elem => elem.id === player2.id);

                if((checkPlayer1 !== -1 && checkPlayer2 !== -1) || (checkPlayer2 !== -1 && player1 == 'ia'))
                {
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
                                    if(final === true)
                                    {
                                        io.to(session).emit('win', true);

                                        setTimeout(() => {
                                            io.to(session).emit('winner');
                                        }, 2000);
                                    }
                                    else
                                    {
                                        io.to(session).emit('draw', true);
                                    }

                                    let findPlayer1 = players.findIndex(elem => elem.id === player1.id);
                                    let findPlayer2 = players.findIndex(elem => elem.id === player2.id);

                                    // setTimeout(() => {
                                    //     io.to(player1.id).emit('next_game');
                                    //     io.to(player2.id).emit('next_game');
                                    // }, 3000);

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

        client.send(JSON.stringify({'players': players.length}));
    
        // Réception d'un message.
    
        socket.on('debug', function(message) {
            console.log(players);
            // console.log(games);
            // console.log(gameInfo);
            // console.log(client);
        })

        socket.on('session', function(session) {
            if(session !== idPartie)
            {
                if(session === 'jcdecaux') return;

                console.log('bad session', session, socket.id);
                
                let findPlayer = players.findIndex(elem => elem.id === socket.id);

                players.splice(findPlayer, 1);

                client.send(JSON.stringify({'players': players.length}));
                io.emit('nb_players', players.length);
            }
        });

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

            if(find !== -1)
            {
                console.log(socket.id + ' has disconnect');
                players.splice(find, 1);
            }

            client.send(JSON.stringify({'players': players.length}));

        });
    }
    else
    {
        socket.emit('too_many', true);
        socket.disconnect();
    }
    
});

server.listen(8080);