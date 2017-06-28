/**
 * @file PhysicalBody class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

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

