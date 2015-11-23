/**
 * The Renderer of the Chip8 emulator
 *
 * @param canvas the canvas to draw on
 * @param width width of the chip8
 * @param height height of the chip8
 * @param cellSize Size of a cell
 * @param fgColor Foreground Color
 * @param bgColor Background Color
 * @returns {{clear: Function, render: Function, beep: Function}}
 * @constructor
 */
function Chip8Renderer(canvas, width, height, cellSize, fgColor, bgColor){

    width = width || 64;
    height = height || 32;
    cellSize = cellSize || 10;
    fgColor = fgColor || '#f00';
    bgColor = bgColor || '#fff';

    var context2D = canvas.getContext('2d');

    var contextAudio;

    try{
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        contextAudio = new AudioContext();
    } catch (e){
        alert('Your browser does not support Web Audio API');
    }


    return {

        clear : function clear(){
            context2D.clearRect(0, 0, width * cellSize, height * cellSize );
        },

        render : function render(display){
            this.clear();
            var x, y;

            for (var i = 0, len = display.length; i < len; i++) {
                x = (i % width) * cellSize;
                y = Math.floor(i / width) * cellSize;

                context2D.fillStyle = [bgColor, fgColor][display[i]];
                context2D.fillRect(x, y, cellSize, cellSize);
            }
        },

        beep: function beep(){
            if(contextAudio){

                var oscillator = contextAudio.createOscillator();
                oscillator.connect(contextAudio.destination);
                oscillator.type = 'square';
                oscillator.start();
                setTimeout(function () {
                    oscillator.stop();
                }, 100);
            }
        }
    };
}

module.exports = Chip8Renderer;
