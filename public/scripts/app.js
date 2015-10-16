var renderer = Chip8Renderer(
    document.getElementById('chipCanvas'),
    Chip8.getDisplayWidth,
    Chip8.getDisplayHeight,
    10);

Chip8.setRenderer(renderer);


var xhr = new XMLHttpRequest();
//Test with PONG, later, try to implement a choice between multiple game.
xhr.open('GET', 'public/roms/PONG2', true);
xhr.responseType = 'arraybuffer';

xhr.onload = function () {
    var arrayBuffer = xhr.response; // Note: not oReq.responseText
    if (arrayBuffer) {
        Chip8.stop();
        Chip8.reset();
        Chip8.loadProgram(new Uint8Array(arrayBuffer));
        Chip8.start();
    }
};

xhr.send(null);


