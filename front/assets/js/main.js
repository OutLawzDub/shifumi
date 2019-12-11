// Hide & Show elements

var choix = null;

// Set my choice

function myChoice(choice)
{
    choix = choice;

    hideElement($('.choices'));

    switch (choice) {
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
}

// Hide elements

function hideElement(elem = false)
{
    if(elem === false)
    {
        $('.bloc').removeAttr('style').attr('style', 'display: none');
    }
    else
    {
        elem.attr('style', 'display: none;');
    }
}

// Show elements

function showElement(elem = false)
{
    if(elem === false)
    {
        $('.bloc').removeAttr('style');
    }
    else
    {
        elem.removeAttr('style');
    }
}

// Timer

function msToTime(duration, second = false)
{
    var seconds = Math.floor((duration / 1000) % 60);
    var minutes = Math.floor((duration / (1000 * 60)) % 60);

    if(second === true)
    {
        return seconds + " secondes";
    }
    else
    {
        return minutes + "m " + seconds + "s";
    }
}

function autoRotate()
{
    let ammount = window.orientation;

    if(ammount != 0)
    {
        showElement($('.rotate'));
    }
    else if(ammount == 0 || ammount === undefined)
    {
        hideElement($('.rotate'));
    }
}

// Particles

particlesJS.load('particles-js', 'assets/json/particle.json');

$(document).ready(function () {
    
    autoRotate();

    var app = document.getElementById('rotate');

    var typewriter = new Typewriter(app, {
        loop: false
    });

    typewriter.typeString('Retournez l\'ecran...').start()
});

window.addEventListener("orientationchange", function() {
    autoRotate()
}, false);

var app = document.getElementById('texte');

var typewriter = new Typewriter(app, {
    loop: false
});

typewriter.typeString('Faites votre choix...').start()