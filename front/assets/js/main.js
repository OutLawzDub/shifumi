// Hide & Show elements

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

function msToTime(duration)
{
    var seconds = Math.floor((duration / 1000) % 60);
    var minutes = Math.floor((duration / (1000 * 60)) % 60);
    
    return minutes + "m " + seconds + "s";
}

// Particles

particlesJS.load('particles-js', 'assets/json/particle.json');