var socket = io.connect('http://192.168.1.124:8080');

// Functions

function debug()
{
    socket.emit('debug', true);
}

function resetGame()
{
    $('.space > .left').css('background', 'grey').html('');
    $('.space > .right').css('background', 'grey').html('');

    showElement($('.choices'));
    hideElement($('.resultats'));
}

// End Functions

socket.on('ready', function(message) {
    hideElement($('.wait'));

    socket.emit('session', $_GET('session'));
});

socket.on('color', function(color) {
    $('body').css('background-color', color);
})

socket.on('refresh_page', function() {
    // window.location.reload();
})

socket.on('user_left', function(message) {
    hideElement();
    showElement($('.left'));
});

socket.on('draw', function() {
    showElement($('.resultats'));
    hideElement($('.choices'));

    $('.resultats').html('C\'EST UNE EGALITE, DOMMAGE !')
});

socket.on('win', function() {
    showElement($('.resultats'));
    hideElement($('.choices'));
    
    $('.resultats').html('C\'EST UNE VICTOIRE, FELICITATIONS !')
});

socket.on('lose', function() {
    showElement($('.resultats'));
    hideElement($('.choices'));
    
    $('.resultats').html('C\'EST UNE DEFAITE, DOMMAGE !');
});

socket.on('terminus', function(choices) {

    let player1 = choices.player1;
    let player2 = choices.player2;

    let choose1 = choices.choose1;
    let choose2 = choices.choose2;

    if(player1 === socket.id)
    {
        switch (choose1) {
            case "pierre":
                $('.space > .left').html('✊').css('background', '#e74c3c');
                break;
            case "feuille":
                $('.space > .left').html('✋').css('background', '#2ecc71');
                break;
            case "ciseaux":
                $('.space > .left').html('✌').css('background', '#2980b9');
                break;
        }

        switch (choose2) {
            case "pierre":
                $('.space > .right').html('✊').css('background', '#e74c3c');
                break;
            case "feuille":
                $('.space > .right').html('✋').css('background', '#2ecc71');
                break;
            case "ciseaux":
                $('.space > .right').html('✌').css('background', '#2980b9');
                break;
        }
    }
    
    if(player2 === socket.id)
    {
        switch (choose2) {
            case "pierre":
                $('.space > .left').html('✊').css('background', '#e74c3c');
                break;
            case "feuille":
                $('.space > .left').html('✋').css('background', '#2ecc71');
                break;
            case "ciseaux":
                $('.space > .left').html('✌').css('background', '#2980b9');
                break;
        }

        switch (choose1) {
            case "pierre":
                $('.space > .right').html('✊').css('background', '#e74c3c');
                break;
            case "feuille":
                $('.space > .right').html('✋').css('background', '#2ecc71');
                break;
            case "ciseaux":
                $('.space > .right').html('✌').css('background', '#2980b9');
                break;
        }
    }
})

socket.on('nb_players', function(nb) {
    if(nb > 0)
    {
        showElement($('.count'));

        $('.count > .nb').html(nb);
    }
    else
    {
        hideElement($('.count'));
    }
    
})

socket.on('reset_game', function() {
    resetGame();
})

socket.on('winner', function() {
    hideElement();
    showElement($('.winner'));

    var app = document.getElementById('winner');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('Vous etes le grand gagnant !')
        .start()
})


socket.on('next_game', function(message) {
    hideElement();
    showElement($('.next-game'));

    var app = document.getElementById('next');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('Perdu...')
        .pauseFor(1000)
        .deleteAll()
        .typeString('Veuillez attendre la prochaine partie...')
        .start()
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

socket.on('timer_choose', function(timer) {
    var left = msToTime(timer, true);

    showElement($('.timer-choose'));

    $('.timer-choose > strong').html(left);
});

socket.on('hide_timer_choose', function() {

    socket.emit('choice', choix);

    hideElement($('.timer-choose'));
});

socket.on('game_waiting', function(message) {
    hideElement();
    showElement($('.delay'));
    showElement($('.starting'));

    resetGame();

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

    var app = document.getElementById('texte');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('Faites votre choix...')
        .start()
    
    console.log(message);
});