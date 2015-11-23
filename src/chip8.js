/**
 * The Chip8 emulator object
 *
 * To realise this emulator I use :
 * [http://blog.alexanderdickson.com/javascript-chip-8-emulator]{@tutorial create a Chip8 emulator}
 * [http://devernay.free.fr/hacks/chip8/C8TECH10.HTM]{@link Chip8 technical reference}
 */

function Chip8(){
    /**
     * The address where the rom is loaded
     * @type {number}
     */
    const ROM_START = 0x200;

    /**
     * CHIP8 Memory size
     * @type {number}
     */
    const CHIP8_MEMORY = 0x1000;

    /**
     * Number of registers
     * @type {number}
     */
    const CHIP8_REGISTERS = 16;

    /**
     * Level of the stack
     * @type {number}
     */
    const CHIP8_STACK_LEVELS = 16;

    const CHIP8_WIDTH = 64;
    const CHIP8_HEIGHT = 32;

    /**
     * FONT SET of the Chip8
     * @type {number[]}
     */
    const FONT_SET= [
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

    /**
     * Store keys pressed
     * @type {{}}
     */
    var keys = {};

    /**
     * Tell whether the program should run or not
     * @type {boolean}
     */
    var running = null;

    /**
     * Tells whether or not the emulator have to redraw the screen
     * @type {boolean}
     */
    var drawFlag = false;

    /**
     * Use to render the chip8 screen
     */
    var rendererChip = null;

    /**
     * Reset the emulator
     */
    function reset(){

        var i;

        /**
         * Use as cache for array.length
         */
        var len;

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

        get getDisplayWidth(){
            return CHIP8_WIDTH;
        },

        get getDisplayHeight() {
            return CHIP8_HEIGHT;
        },

        setRenderer : function setRenderer(renderer) {
            if((typeof renderer.clear == "function") &&
                (typeof renderer.render == "function") &&
                (typeof renderer.beep == "function")){
                rendererChip = renderer;
            }
            else
                throw console.error("The given renderer does not have one or"+
                    " more of these 3 function : clear, render(display), beep");
        },

        /**
         * Set the pressed key by the user
         * @param key key pressed by user
         */
        setKey : function setKey(key) {
            keys[key] = true;
        },

        /**
         * Remove the key, not pressed anymore by the user
         * @param key
         */
        unsetKey : function unsetKey(key) {
            delete keys[key];
        },

        loadProgram : function loadProgram(program){

            for(var i = 0, len = program.length; i<len; i++){
                memory[ROM_START + i] = program[i];
            }
        },

        reset : reset,

        start : function (canvas) {

            if(rendererChip == null){
                if(canvas != null){
                    rendererChip = require('../src/renderer')(canvas, CHIP8_WIDTH, CHIP8_HEIGHT);
                } else {
                    throw new Error('You must specify a renderer.');
                }
            }

            running = true;
            var self = this;

            requestAnimationFrame(function draw() {

                //Emulate 16 cycle of the chip8
                for(var i = 0; i<18; i++){
                    if(running){
                        self.emulateCycle();
                    }
                }

                //Redraw if necessary
                if(drawFlag){
                    rendererChip.render(display);
                    drawFlag = false;
                }

                delayTimer --;

                if (soundTimer > 0) {
                    if (soundTimer == 1) {
                        rendererChip.beep();
                    }
                    soundTimer--;
                }

                requestAnimationFrame(draw);
            });

        },

        stop : function () {
            running = false;
        },

        /**
         * Emulate a cycle of the Chip8
         * If you want more information about the Chip8, please, check out this link below :
         * {@link} http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
         */
        emulateCycle: function emulateCycle(){
            var opCode = memory[pc] << 8 | memory[pc+1];
            var X = (opCode & 0x0F00) >> 8;
            var Y = (opCode & 0x00F0) >> 4;

            //console.log(opCode.toString(16).toUpperCase(), opCode);

            pc += 2;

            switch(opCode & 0xF000){

                case 0x0000 : {

                    switch(opCode){

                        //clear the screen
                        case 0x00E0 : {
                            for(var i = 0, len=display.length; i<len; i++)
                                display[i] = 0;

                            drawFlag = true;
                            break;
                        }

                        //Return from a subroutine
                        case 0x00EE : {
                            pc = stack[--sp];
                            break;
                        }
                    }
                    break;
                }

                //Jump to address NNN
                case 0x1000 : {
                    pc = opCode & 0xFFF;
                    break;
                }

                //calls subroutine at NNN
                case 0x2000 : {
                    stack[sp] = pc;
                    sp ++;
                    pc = opCode & 0x0FFF;
                    break;
                }

                //Skips the next instruction if VX equals NN.
                case 0x3000 : {
                    if(v[X] === (opCode & 0x00FF)){
                        pc += 2;
                    }
                    break;
                }

                //Skips the next instruction if VX doesn't equal NN
                case 0x4000 : {
                    if(v[X] != (opCode & 0x00FF)) {
                        pc += 2;
                    }
                    break;
                }

                //Skips the next instruction if VX equals VY.
                case 0x5000 : {
                    if(v[X] === v[Y]){
                        pc += 2;
                    }
                    break;
                }

                //Sets VX to NN.
                case 0x6000 : {
                    v[X] = opCode & 0x00FF;
                    break;
                }

                //Adds NN to VX.
                case 0x7000 : {
                    var val = (opCode & 0xFF) + v[X];

                    if (val > 255)
                        val -= 256;

                    v[X] = val;
                    break;
                }

                case 0x8000 : {

                    switch (opCode & 0x000F){

                        // Sets VX to the value of VY.
                        case 0x0000 : {
                            v[X] = v[Y];
                            break;
                        }

                        //Sets VX to VX or VY.
                        case 0x0001 : {
                            v[X] |= v[Y];
                            break;
                        }

                        //Sets VX to VX and VY.
                        case 0x0002 : {
                            v[X] &= v[Y];
                            break;
                        }

                        //Sets VX to VX xor VY.
                        case 0x0003 : {
                            v[X] ^= v[Y];
                            break;
                        }

                        //Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                        case 0x0004 : {
                            v[X] += v[Y];

                            v[0xF] = +(v[X] > 255);
                            if (v[X] > 255)
                                v[X] += 256;

                            break;
                        }

                        //VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                        case 0x0005 : {
                            v[0xF] = +(v[X] > v[Y]);
                            v[X] -= v[Y];
                            if (v[X] < 0)
                                v[X] += 256;

                            break;
                        }

                        //Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                        case 0x0006 : {
                            v[0xF] = v[X] & 0x1;
                            v[X] >>= 1;

                            break;
                        }

                        //Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                        case 0x0007 : {
                            v[0xF] = +(v[Y] > v[X]);
                            v[X] = v[Y] - v[X];
                            if (v[X] < 0) {
                                v[X] += 256;
                            }

                            break;
                        }

                        //Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
                        case 0x000E : {
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

                //Skips the next instruction if VX doesn't equal VY.
                case 0x9000 : {
                    if(v[X] != v[Y]){
                        pc += 2;
                    }

                    break;
                }

                //Sets I to the address NNN.
                case 0xA000 : {
                    I = opCode & 0x0FFF;

                    break;
                }

                //Jumps to the address NNN plus V0.
                case 0xB000: {
                    pc = (opCode & 0x0FFF) + v[0];
                    break;
                }

                //Sets VX to the result of a bitwise and operation on a random number and NN.
                case 0xC000 : {
                    v[X] = Math.floor(Math.random() * 0x00FF) & (opCode & 0x00FF);
                    break;
                }

                /**
                 * Sprites stored in memory at location in index register (I), 8bits wide. Wraps around the screen
                 * If when drawn, clears a pixel, register VF is set to 1 otherwise it is zero.
                 * All drawing is XOR drawing (i.e. it toggles the screen pixels).
                 * Sprites are drawn starting at position VX, VY. N is the number of 8bit rows that need to be drawn
                 * If N is greater than 1, second line continues at position VX, VY+1, and so on.
                 */
                case 0xD000 : {

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

                        //Skips the next instruction if the key stored in VX is pressed.
                        case 0x009E : {
                            if(keys[v[X]]) {
                                pc += 2;
                            }

                            break;
                        }

                        //Skips the next instruction if the key stored in VX isn't pressed.
                        case 0x00A1 : {
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

                        //Sets VX to the value of the delay timer.
                        case 0x0007:{
                            v[X] = delayTimer;
                            break;
                        }

                        //A key press is awaited, and then stored in VX.
                        case 0x000A :{

                            var oldKeySet = this.setKey;
                            var self = this;

                            this.setKey = function (key){
                                v[X] = key;
                                self.setKey = oldKeySet.bind(self);
                                self.setKey.apply(self, arguments);

                                this.start();
                            };

                            this.stop();
                            break;
                        }

                        //Sets the delay timer to VX.
                        case 0x0015 :{
                            delayTimer = v[X];
                            break;
                        }

                        //Sets the sound timer to VX.
                        case 0x0018 :{
                            soundTimer = v[X];
                            break;
                        }

                        //Adds VX to I.
                        case 0x001E : {
                            I += v[X];
                            break;
                        }

                        //Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                        case 0x0029 : {
                            I = v[X] * 5;
                            break;
                        }

                        /*
                        * Stores the Binary-coded decimal representation of VX, with the most significant of three digits at
                        * the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2.
                        * */
                        case 0x0033 :{
                            memory[I]   =  v[X] / 100;
                            memory[I+1] = (v[X] / 10 ) % 10;
                            memory[I+2] = (v[X] % 100) % 10;

                            break;
                        }

                        //Stores V0 to VX in memory starting at address I.[4]
                        case 0x0055 : {
                            for(i = 0; i<=X; i++){
                                memory[I+i] = v[i];
                            }
                            break;
                        }

                        //Fills V0 to VX with values from memory starting at address I.[4]
                        case 0x0065 : {
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
};

module.exports = Chip8;
