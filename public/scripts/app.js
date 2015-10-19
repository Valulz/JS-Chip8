(function(){
    var CELL_SIZE = 10;

    var renderer = Chip8Renderer(
        document.getElementById('chipCanvas'),
        Chip8.getDisplayWidth,
        Chip8.getDisplayHeight,
        CELL_SIZE);

    Chip8.setRenderer(renderer);


    var xhr = new XMLHttpRequest();

    //Implement a choice between multiple game.
    xhr.open('GET', 'public/roms/PONG2', true);

    xhr.responseType = 'arraybuffer';

    xhr.onload = function () {
        var arrayBuffer = xhr.response;
        if (arrayBuffer) {
            Chip8.stop();
            Chip8.reset();
            Chip8.loadProgram(new Uint8Array(arrayBuffer));
            Chip8.start();
        }
    };

    xhr.send(null);
})();