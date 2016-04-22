'use strict';

let murmures = {
    log: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};

(function load() {
    murmures.C = require('./constants');
    murmures.level = require('./level');
    murmures.character = require('./character');
    // murmures.player = require('./player');
    // ...
})();

module.exports = murmures;
