
function Chip8Renderer(canvas, width, height, cellSize, fgColor, bgColor){

    fgColor = fgColor || '#f00';
    bgColor = bgColor || '#fff';

    var context2D = canvas.getContext('2d');

    var contextAudio =  window.AudioContext && new AudioContext ||
                        window.webkitAudioContext && new webkitAudioContext;

    return {
        clear : function clear(){
            context2D.clearRect(0, 0, width * cellSize, height * cellSize );
        },
        render : function render(display){
            this.clear();
            var x, y;

            for(var i = 0, len = display.length; i<len; i++){
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



