'use strict';

let murmures = {
    log: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};

(function load() {
    murmures.C = require('./constants');
    murmures.tile = require('./tile');
    murmures.level = require('./level');
    murmures.character = require('./character');
    murmures.player = require('./player');
    murmures.physicalBody = require('./physicalBody');
    
    murmures.gameEngine = require('./gameEngine');
    // ...
})();

module.exports = murmures;
