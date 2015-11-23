(function(){

    var xhr = new XMLHttpRequest();
    //Implement a choice between multiple game.
    xhr.open('GET', './roms/PONG2', true);

    xhr.responseType = 'arraybuffer';

    xhr.onload = function () {
        var arrayBuffer = xhr.response;
        if (arrayBuffer) {
            Chip8.stop();
            Chip8.reset();
            Chip8.loadProgram(new Uint8Array(arrayBuffer));
            Chip8.start(document.getElementById('chipCanvas'));
        }
    };

    xhr.send(null);
})();
