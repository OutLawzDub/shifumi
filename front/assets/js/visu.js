// Particles

particlesJS.load('particles-js', '../assets/json/particle.json');

// QrCode

var qrcode = new QRCode("qrcode", {
    width: 512,
    height: 512,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

function setQrCode(id)
{
    if(qrcode !== undefined)
    {
        qrcode.clear();
    }

    qrcode.makeCode("http://192.168.1.124/shifumi/front/?session=" + id);
}

//

var toggle = false;

function switchAnimation()
{
    let size;

    if(toggle === false)
    {
        toggle = true;
        size   = '85px';   
    }
    else
    {
        toggle = false;
        size   = '80px';
    }

    $('#qrcode > h1').animate(
        {
            'font-size': size
        }
    , 1000);
}

setInterval(() => {
    switchAnimation();
}, 1000);

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

// Websocket

let socket = new WebSocket("ws://192.168.1.124:1880/shifumi");

socket.onopen = function(e) {
    console.log({connected: true});
};

socket.onmessage = function(event) {
    let data = event.data;
    let json = JSON.parse(data);

    if(json.color)
    {
        $('body').css('background-color', json.color);
        $('.winner-visu').removeAttr('style');
        $('.pending').hide();
    }

    if(json.timer !== undefined)
    {
        var left = msToTime(json.timer);

        if(json.timer == 0)
        {
            $('.delay-visu').hide();
        }
        else
        {
            $('.delay-visu').show();
            $('.delay-visu > strong').html(left);
        }
    }

    if(json.payload)
    {
        if(json.payload === "no_player")
        {
            console.log('nooppp');

            $('.no_players').removeAttr('style');
            $('#qrcode').hide();
        }
    }

    if(json.draw)
    {
        let color1 = json.color1;
        let color2 = json.color2;

        $('.pending').hide();
        $('.no_players').attr('style', 'display:none;');
        $('.draw').removeAttr('style');

        $('body').css('background-image', 'linear-gradient(90deg, ' + color1 + ' 30%, ' + color2 + ')');
    }

    if(json.qrcode !== undefined)
    {
        $('body').css('background-image', 'none').css('background-color', 'rgb(35, 39, 65)');
        $('.pending').hide()
        $('.draw').attr('style', 'display:none;');
        $('.winner-visu').attr('style', 'display:none;');
        $('.no_players').attr('style', 'display:none;');
        $('#qrcode').show();

        setQrCode(json.qrcode);
    }

    if(json.win !== undefined)
    {
        $('.pending').hide();
        $('.winner-visu').removeAttr('style');
    }

    if(json.start)
    {
        $('.delay-visu').attr('style', 'display:none;')
    }

    if(json.players !== undefined)
    {
        let nbPlayers = json.players;

        if(nbPlayers == 0)
        {
            $('.players').hide();
        }
        else
        {
            $('.players').show();
            $('.players > strong').html(json.players);
        }
    }

    if(json.level !== undefined)
    {
        $('#qrcode').hide();
        $('.pending').show();
        $('.pending > h1').html('Vague ' + (json.level + 1));
    }
    
    console.log(json);
};

socket.onclose = function(event) {
    if (event.wasClean)
    {
        window.location.reload();
    }
    else
    {
        window.location.reload();
    }
};