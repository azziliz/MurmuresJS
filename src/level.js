'use strict';

let C = require('./constants');

module.exports = function () {
    this.code = '';
    this.layout = C.SQUARE_TILES_LAYOUT;
    this.width = 0;
    this.height = 0;
    this.tiles = {};
    // ...
};