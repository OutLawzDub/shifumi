var socket = io.connect('http://localhost:8082');

socket.on('ready', function(message) {
    console.log(message);
});