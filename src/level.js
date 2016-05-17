'use strict';
//debugger;

/**
 * @file Level class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * Level is a class that contains all necessary information to build a new game zone.
 * 
 * This includes the zone topology, defined by an array of [tiles]{@link murmures.Tile}, as well as the starting points for all [characters]{@link murmures.Character}.
 * 
 * Static levels created by the editor are stored in JSON files, usually named /data/levelXX.json.
 * These files are in a "clean" state that contains only non-empty properties. 
 * Missing tile layers and starting points are calculated when the level is loaded by the "fromJson" method.
 * 
 * @class
 */
murmures.Level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="heroStartingTiles" type="Tile"/>
        /// <field name="mobStartingTiles" type="Tile"/>
};

murmures.Level.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.heroStartingTiles = [];
        this.mobStartingTiles = [];
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile();
                this.tiles[y][x].fromJson(src.tiles[y][x], x, y);
                if (this.tiles[y][x].charId !== '') {
                    let ref = gameEngine.mobsReference[this.tiles[y][x].charId];
                    if (ref.isHero) {
                        this.heroStartingTiles.push(this.tiles[y][x]);
                    } 
                    else {
                        this.mobStartingTiles.push(this.tiles[y][x]);
                    }
                }
            }
        }
    },
    
    clean : function () {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x].clean();
            }
        }
        delete this.heroStartingTiles;
        delete this.mobStartingTiles;
    }    
};

