/**
 * Created by Valentin on 13/10/2015.
 */

var Chip8 = function Chip8(){
    //PSEUDO-CONST
    var ROM_START = 0x200;
    var CHIP8_MEMORY = 0x1000;
    var CHIP8_REGISTERS = 16;
    var CHIP8_STACK_LEVELS = 16;
    var CHIP8_WIDTH = 64;
    var CHIP8_HEIGHT = 32;

    //FONT SET of the Chip8
    var FONT_SET= [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    var display = new Array(CHIP8_WIDTH * CHIP8_HEIGHT);

    //Program Counter
    var pc = null;

    //Memory
    var memory = new Uint8Array(new ArrayBuffer(CHIP8_MEMORY));

    //Registers
    var v = new Array(CHIP8_REGISTERS);

    //Index register
    var I = null;

    //Stack
    var stack = new Array(CHIP8_STACK_LEVELS);

    //Stack Pointer
    var sp = null;

    //Delay Timer
    var delayTimer = null;

    // Sound timer
    var soundTimer = null;

    var keys = {};

    //var step = null;
    var running = null;

    var drawFlag = false;

    var rendererChip = null;

    function reset(){
        var i, len;

        //reset memory
        for(i = 0, len = memory.length; i<len; i++) memory[i] = 0;

        //set the font set
        for(i = 0, len = FONT_SET.length; i<len; i++)   memory[i] = FONT_SET[i];

        //reset registers
        for(i = 0, len = v.length; i<len; i++) v[i] = 0;

        //reset display
        for(i = 0, len=display.length; i<len; i++) display[i] = 0;

        //Reset stack pointer
        sp = 0;
        I = 0;

        // 0x200 : beginning of the program
        pc = ROM_START;

        // Delay timer
        delayTimer = 60;

        // Sound timer
        soundTimer = 60;

        //step = 0;
        running = false;
    }

    reset();

    return {
        get getDisplayWidth(){ return CHIP8_WIDTH;},
        get getDisplayHeight() { return CHIP8_HEIGHT;},
        setRenderer : function (renderer) {
            rendererChip = renderer;
        },
        setKey : function setKey(key) { keys[key] = true;
            console.log(key); },
        unsetKey : function unsetKey(key) {delete keys[key];},
        loadProgram : function loadProgram(program){
            for(var i = 0, len = program.length; i<len; i++){
                memory[ROM_START + i] = program[i];
            }
        },
        reset : reset,
        start : function () {

            if(rendererChip == null){
                throw new Error('You must specify a renderer.');
            }

            running = true;
            var self = this;

            requestAnimationFrame(function draw() {
                for(var i = 0; i<15; i++){
                    if(running){
                        self.emulateCycle();
                    }
                }

                if(drawFlag){
                    //renderer redraw
                    rendererChip.render(display);
                    drawFlag = false;
                }

                delayTimer --;

                if (soundTimer > 0) {
                    if (soundTimer == 1) {
                        console.log('BEEP');
                    }
                    soundTimer--;
                }

                requestAnimationFrame(draw);
            });

        },
        stop : function () {
            running = false;
        },
        emulateCycle: function emulateCycle(){
            var opCode = memory[pc] << 8 | memory[pc+1];
            var X = (opCode & 0x0F00) >> 8;
            var Y = (opCode & 0x00F0) >> 4;

            console.log(opCode.toString(16).toUpperCase(), opCode);

            pc += 2;

            switch(opCode & 0xF000){
                case 0x0000 : {

                    switch(opCode){
                        case 0x00E0 : {
                            //clear the screen
                            for(var i = 0, len=display.length; i<len; i++)
                                display[i] = 0;

                            drawFlag = true;
                            break;
                        }
                        case 0x00EE : {
                            //Return from a subroutine
                            pc = stack[--sp];
                            break;
                        }
                    }
                    break;
                }

                case 0x1000 : {
                    //Jump to address NNN
                    pc = opCode & 0xFFF;
                    break;
                }

                case 0x2000 : {
                    //calls subroutine at NNN
                    stack[sp] = pc;
                    sp ++;
                    pc = opCode & 0x0FFF;
                    break;
                }

                case 0x3000 : {
                    //Skips the next instruction if VX equals NN.
                    if(v[X] === (opCode & 0x00FF)){
                        pc += 2;
                    }
                    break;
                }


                case 0x4000 : {
                    //Skips the next instruction if VX doesn't equal NN
                    if(v[X] != (opCode & 0x00FF)) {
                        pc += 2;
                    }
                    break;
                }

                case 0x5000 : {
                    //Skips the next instruction if VX equals VY.
                    if(v[X] === v[Y]){
                        pc += 2;
                    }
                    break;
                }

                case 0x6000 : {
                    //Sets VX to NN.
                    v[X] = opCode & 0x00FF;
                    break;
                }

                case 0x7000 : {
                    //Adds NN to VX.
                    var val = (opCode & 0xFF) + v[X];

                    if (val > 255)
                        val -= 256;

                    v[X] = val;
                    break;
                }

                case 0x8000 : {

                    switch (opCode & 0x000F){
                        case 0x0000 : {
                            // Sets VX to the value of VY.
                            v[X] = v[Y];
                            break;
                        }

                        case 0x0001 : {
                            //Sets VX to VX or VY.
                            v[X] |= v[Y];
                            break;
                        }

                        case 0x0002 : {
                            //Sets VX to VX and VY.
                            v[X] &= v[Y];
                            break;
                        }

                        case 0x0003 : {
                            //Sets VX to VX xor VY.
                            v[X] ^= v[Y];
                            break;
                        }

                        case 0x0004 : {
                            //Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                            v[X] += v[Y];

                            v[0xF] = +(v[X] > 255);
                            if (v[X] > 255)
                                v[X] += 256;

                            break;
                        }

                        case 0x0005 : {
                            //VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                            v[0xF] = +(v[X] > v[Y]);
                            v[X] -= v[Y];
                            if (v[X] < 0)
                                v[X] += 256;

                            break;
                        }

                        case 0x0006 : {
                            //Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                            v[0xF] = v[X] & 0x1;
                            v[X] >>= 1;

                            break;
                        }

                        case 0x0007 : {
                            //Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                            v[0xF] = +(v[Y] > v[X]);
                            v[X] = v[Y] - v[X];
                            if (v[X] < 0) {
                                v[X] += 256;
                            }

                            break;
                        }

                        case 0x000E : {
                            //Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
                            v[0xF] = +(v[X] & 0x80);
                            v[X] <<= 1;
                            if (v[X] > 255) {
                                v[X] -= 256;
                            }

                            break;
                        }
                    }

                    break;
                }

                case 0x9000 : {
                    //Skips the next instruction if VX doesn't equal VY.
                    if(v[X] != v[Y]){
                        pc += 2;
                    }

                    break;
                }

                case 0xA000 : {
                    //Sets I to the address NNN.
                    I = opCode & 0x0FFF;

                    break;
                }

                case 0xB000: {
                    //Jumps to the address NNN plus V0.
                    pc = (opCode & 0x0FFF) + v[0];
                    break;
                }

                case 0xC000 : {
                    //Sets VX to the result of a bitwise and operation on a random number and NN.
                    v[X] = Math.floor(Math.random() * 0x00FF) & (opCode & 0x00FF);
                    break;
                }

                case 0xD000 : {
                    // Sprites stored in memory at location in index register (I), 8bits wide. Wraps around the screen
                    // If when drawn, clears a pixel, register VF is set to 1 otherwise it is zero.
                    // All drawing is XOR drawing (i.e. it toggles the screen pixels).
                    // Sprites are drawn starting at position VX, VY. N is the number of 8bit rows that need to be drawn
                    // If N is greater than 1, second line continues at position VX, VY+1, and so on.

                    var height = opCode & 0x000F;
                    var pixel = null;
                    v[0xF] = 0;

                    for(var y = 0; y<height; y++)
                    {
                        pixel = memory[I + y];

                        for(var x = 0; x<8; x++)
                        {
                            if((pixel & (0x80 >> x) ) > 0 )
                            {
                                if(display[v[X] + x + (v[Y] + y) * 64 ] == 1){
                                    v[0xF] = 1;
                                }

                                display[(v[X] + x) + ((v[Y] + y) * 64)] ^= 1;
                            }
                        }
                    }

                    drawFlag = true;
                    break;
                }

                case 0xE000 : {
                    switch (opCode & 0x00FF){
                        case 0x009E : {
                            //Skips the next instruction if the key stored in VX is pressed.
                            if(keys[v[X]]) {
                                pc += 2;
                            }

                            break;
                        }

                        case 0x00A1 : {
                            //Skips the next instruction if the key stored in VX isn't pressed.
                            if(!keys[v[X]]){
                                pc += 2;
                            }

                            break;
                        }
                    }
                    break;
                }

                case 0xF000 : {

                    switch (opCode & 0x00FF){

                        case 0x0007:{
                            //Sets VX to the value of the delay timer.
                            v[X] = delayTimer;
                            break;
                        }

                        case 0x000A :{
                            var oldKeySet = this.setKey;
                            var self = this;

                            this.setKey = function (key){
                                v[X] = key;
                                self.setKey = oldKeySet.bind(self);
                                self.setKey.apply(self, arguments);

                                //start
                                this.start();
                            };

                            this.stop();
                            break;
                        }

                        case 0x0015 :{
                            //Sets the delay timer to VX.
                            delayTimer = v[X];
                            break;
                        }

                        case 0x0018 :{
                            //Sets the sound timer to VX.
                            soundTimer = v[X];
                            break;
                        }

                        case 0x001E : {
                            //Adds VX to I.[3]
                            I += v[X];
                            break;
                        }

                        case 0x0029 : {
                            //Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                            I = v[X] * 5;
                            break;
                        }

                        case 0x0033 :{
                            /* Stores the Binary-coded decimal representation of VX, with the most significant of three digits at
                            the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. */
                            memory[I]   =  v[X] / 100;
                            memory[I+1] = (v[X] / 10 ) % 10;
                            memory[I+2] = (v[X] % 100) % 10;

                            break;
                        }

                        case 0x0055 : {
                            //Stores V0 to VX in memory starting at address I.[4]
                            for(i = 0; i<=X; i++){
                                memory[I+i] = v[i];
                            }
                            break;
                        }

                        case 0x0065 : {
                            //Fills V0 to VX with values from memory starting at address I.[4]
                            for(i = 0; i<=X; i++){
                                v[i] = memory[I+i];
                            }
                            break;
                        }
                    }
                    break;
                }

                default:
                    throw new Error('Unknown opCode ' + opCode.toString(16) + ' passed. Terminating.');

            }
        }
    };

}();
