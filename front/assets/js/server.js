var socket = io.connect('http://192.168.1.124:8080');

// Functions

function debug()
{
    socket.emit('debug', true);
}


// End Functions

socket.on('ready', function(message) {
    hideElement($('.wait'));
});

socket.on('game_started', function(message) {
    hideElement();
    showElement($('.started'));

    var app = document.getElementById('progress');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('Une partie est en cours...')
        .start()
});

socket.on('game_waiting', function(message) {
    hideElement();
    showElement($('.delay'));
    showElement($('.starting'));

    var app = document.getElementById('waiting');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('En attente de joueurs...')
        .pauseFor(5000)
        .deleteAll()
        .typeString('La partie va bientot commencer...')
        .start()
});

socket.on('timer', function(message) {
    var left = msToTime(message);

    $('.delay > strong').html(left);
});

socket.on('too_many', function() {
    hideElement();
    showElement($('.too'));
    
    var app = document.getElementById('too');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('La partie est pleine...')
        .pauseFor(2500)
        .deleteAll()
        .typeString('Attendez la prochaine partie.')
        .start()
});

socket.on('start', function(message) {
    hideElement();
    showElement($('.game'));
    hideElement($('.delay'));
    console.log(message);
});