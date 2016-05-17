'use strict';
//debugger;

murmures.PhysicalBody = function () {
    this.uniqueId = '';
    this.tileset = '';
    this.tilesetReference = '';
    this.layer = '';
    this.allowFlying = false;
    this.allowTerrestrial = false;
    this.allowAquatic = false;
    this.allowUnderground = false;
    this.allowEthereal = false;
    this.behavior = {};
};

