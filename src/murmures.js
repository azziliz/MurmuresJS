'use strict';

let murmures = {
    log: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};

(function load() {
    murmures.character = require('./character');
    // murmures.player = require('./player');
    // ...
})();

module.exports = murmures;
