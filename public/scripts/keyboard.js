/**
 * Created by Valentin on 14/10/2015.
 */
(function() {

    var translateKeys = {
        49: 0x1,  // 1
        50: 0x2,  // 2
        51: 0x3,  // 3
        52: 0x4,  // 4

        65: 0x5,  // A
        90: 0x6,  // Z
        69: 0x7,  // E
        82: 0x8,  // R

        81: 0x9,  // Q
        83: 0xA,  // S
        68: 0xB,  // D
        70: 0xC,  // F

        87: 0xD,  // W
        88: 0xE,  // X
        67: 0xF,  // C
        86: 0x10  // V
    };
    document.addEventListener('keydown', function(event) {
        Chip8.setKey(translateKeys[event.keyCode]);
    });
    document.addEventListener('keyup', function(event) {
        Chip8.unsetKey(translateKeys[event.keyCode]);
    });
})();
