
function Chip8Renderer(canvas, width, height, cellSize, fgColor, bgColor){

    fgColor = fgColor || '#f00';
    bgColor = bgColor || '#fff';

    var context = canvas.getContext('2d');


    //add audio context

    return {
        clear : function clear(){
            context.clearRect(0, 0, width * cellSize, height * cellSize );
        },
        render : function render(display){
            this.clear();
            var x, y;

            for(var i = 0, len = display.length; i<len; i++){
                x = (i % width) * cellSize;
                y = Math.floor(i / width) * cellSize;

                context.fillStyle = [bgColor, fgColor][display[i]];
                context.fillRect(x, y, cellSize, cellSize);

            }

        }
    };
}