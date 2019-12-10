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

var game = {
    etat: 0,
    players: 0
};

/**
 * Instructions Game Configuration
 * All time asked = milliseconds
 * 
 * timeBeforePlaying : delay for user to join starting game
 * timeToCHoose : delay for user choosing rock paper or cissors
 */

var configuration = {
    timeBeforePlaying: 30000,
    timeToChoose: 5000,
    limitUser: 50
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
        game.etat = 2;
        io.emit('start', {game: true});
        startChecker();

        console.log('La partie commence.');
    }, configuration.timeBeforePlaying);
}

function addPlayer(id)
{
    var player = {
        id: id,
        level: 0,
        playing: false
    };

    players.push(player);
}

var intervalChecker;

function startChecker()
{
    intervalChecker = setInterval(() => {
        let player = players.filter(elem => elem.playing === false);

        for (let i = 0; i < player.length; i++)
        {
            const id      = player[i].id;
            const level   = player[i].level;
            const playing = player[i].playing;

            let correspond = player.filter(elem => elem.level === level && elem.id !== id && elem.playing === false);

            if(correspond.length == 1)
            {
                let joueur = correspond[0];

                console.log('Il y à des joueurs', joueur);
            }
            else if(correspond.length == 0)
            {
                console.log('tout seul');
            }
        }

        console.log(player);
    }, 1000);
}

// End function

var players = [];

io.sockets.on('connection', function (socket) {
    socket.emit('ready', {valid: true});

    let max = players.length === configuration.limitUser;

    if(!max)
    {
        switch (game.etat) {
            case 0:
                game.etat = 1;
                startTimer();
                addPlayer(socket.id);
                socket.emit('game_waiting', {waiting: true});
                break;
            case 1:
                addPlayer(socket.id);
                socket.emit('game_waiting', {waiting: true});
                break;
            case 2:
                socket.emit('game_started', {playing: true});
                break;
        }
    
        // Réception d'un message.
    
        socket.on('debug', function(message) {
            console.log(players);
        })

        socket.on('disconnect', function () {
            var find = players.findIndex(elem => elem.id === socket.id);
    
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