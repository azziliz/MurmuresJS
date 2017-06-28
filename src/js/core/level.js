/**
 * @file Level class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * Level is a class that contains all necessary information to build a new game zone.
 *
 * This includes the zone topology, defined by an array of [tiles]{@link murmures.Tile}, as well as the starting points for all [characters]{@link murmures.Character}.
 *
 * Static levels created by the editor are stored in JSON files, usually named /data/levelXX.json.
 * These files are in a "clean" state that contains only non-empty properties.
 * Missing tile layers and starting points are calculated when the level is loaded by the "build" method.
 *
 * @class
 */
murmures.Level = function () {
    /** @type {string} */
    this.guid = '';
    /** @type {string} */
    this.id = '';
    /** @type {string} */
    this.layout = '';
    /** @type {number} */
    this.width = 0;
    /** @type {number} */
    this.height = 0;
    /** @type {Array.<Array.<murmures.Tile>>} */
    this.tiles = [];
    /** @type {Array.<murmures.Character>} */
    this.mobs = [];
};

murmures.Level.prototype = {
    /**
     * Initialization method reserved for the server.
     * Called once per level during server startup to build the gameEngine master instance.
     * Creates a full Level object from a file generated by the editor.
     *
     * @param {Object} src - A parsed version of an input file.
     * This parameter is expected to contain all tiles in a clean state and no mob.
     */
    build : function (src) {
        this.guid = Math.random().toString();
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width | 0;
        this.height = src.height | 0;
        this.tiles = [];
        this.mobs = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile(x, y);
                this.tiles[y][x].build(src.tiles[y][x]);
                if (this.tiles[y][x].charId !== '') {
                    let mob = new murmures.Character();
                    mob.build(this.tiles[y][x], this.tiles[y][x].charId);
                    this.mobs.push(mob);
                }
            }
        }
    },

    /**
     * Initialization method reserved for the client.
     * Called everytime the client loads a new level.
     * Creates a partial Level object from a source JSON. The partial object contains all tiles in an empty state and no mob.
     *
     * @param {Object} src - A stringified and parsed partial level received from the server.
     * This parameter is expected to contain the level headers (including width and height) and a set of clean tiles.
     * It might also contain some mobs, if they are visible from the level starting point.
     */
    initialize : function (src) {
        this.guid = src.guid;
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width | 0;
        this.height = src.height | 0;
        this.tiles = [];
        this.mobs = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile(x, y);
                src.tiles[y][x].x = x;
                src.tiles[y][x].y = y;
            }
        }
        this.synchronize(src);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                //TODO: test if can do that directly in tile.synchronize
                this.tiles[y][x].behavior = (this.tiles[y][x].propId === '') ? {} : gameEngine.bodies[this.tiles[y][x].propId].behavior;
            }
        }
    },

    /**
     * Synchronization method reserved for the client.
     * Called after each turn, when the client receives a server response.
     * Merges tile and mob data into the existing Level object (this).
     *
     * @param {Object} src - A stringified and parsed partial level received from the server.
     * This parameter is expected to contain updates for known tiles and complete objects for newly discovered tiles.
     * It might also contain mob updates and new mobs.
     */
    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.tiles !== 'undefined') {
            src.tiles.forEach(function (remoteTileRow) {
                remoteTileRow.forEach(function (remoteTile) {
                    let localTile = this.tiles[remoteTile.y][remoteTile.x];
                    localTile.synchronize(remoteTile);
                }, this);
            }, this);
        }
        if (typeof src.mobs !== 'undefined') {
            src.mobs.forEach(function (remoteMob) {
                let found = false;
                this.mobs.forEach(function (localMob) {
                    if (localMob.guid === remoteMob.guid) {
                        found = true;
                        localMob.synchronize(remoteMob);
                    }
                }, this);
                if (!found) {
                    let newMob = new murmures.Character();
                    newMob.initialize(remoteMob);
                    this.mobs.push(newMob);
                }
            }, this);
        }
    },

    /**
     * Cloning method reserved for the server.
     * The whole game state is duplicated at the beginning of each turn by cascading clone methods.
     */
    clone : function () {
        let tiles_ = [];
        for (let y = 0; y < this.height; y++) {
            tiles_[y] = [];
            for (let x = 0; x < this.width; x++) {
                tiles_[y][x] = this.tiles[y][x].clone();
            }
        }
        let mobs_ = [];
        for (let itMob=0; itMob < this.mobs.length; itMob++) {
            mobs_.push(this.mobs[itMob].clone());
        }
        return {
            guid: this.guid,
            tiles: tiles_,
            mobs: mobs_,
        };
    },

    /**
     * Comparison method reserved for the server.
     * This method is called at the end of each turn to identify the changes of the game state produced by orders.
     * Returns all the fields that were actually modified.
     *
     * @param {Object} beforeState - A stringified and parsed level that was saved before the turn by calling clone().
     */
    compare : function (beforeState) {
        let ret = {};
        if (this.guid === beforeState.guid) {
            // same level
            let tileRows_ = [];
            for (let y = 0; y < this.height; y++) {
                let tiles_ = [];
                for (let x = 0; x < this.width; x++) {
                    let tile_ = this.tiles[y][x].compare(beforeState.tiles[y][x]);
                    if (typeof tile_ !== 'undefined') tiles_.push(tile_);
                }
                if (tiles_.length > 0) tileRows_.push(tiles_);
            }
            if (tileRows_.length > 0) ret.tiles = tileRows_;
            let mobs_ = [];
            this.mobs.forEach(function (newMob) {
                beforeState.mobs.forEach(function (oldMob) {
                    if (newMob.guid === oldMob.guid) {
                        let mob_ = newMob.compare(oldMob);
                        if (typeof mob_ !== 'undefined') mobs_.push(mob_);
                    }
                }, this);
            }, this);
            if (mobs_.length > 0) ret.mobs = mobs_;
        }
        else {
            // hero used stairs to change level
            ret.guid = this.guid;
            ret.id = this.id;
            ret.layout = this.layout;
            ret.width = this.width | 0;
            ret.height = this.height | 0;
            let newLevel = this.clone(); // TODO : replace by a clean creation / reuse tile.compare ?
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    delete newLevel.tiles[y][x].x;
                    delete newLevel.tiles[y][x].y;
                    delete newLevel.tiles[y][x].behavior;
                    delete newLevel.tiles[y][x].charId;
                    if (newLevel.tiles[y][x].state === murmures.C.TILE_NOT_DISCOVERED) delete newLevel.tiles[y][x].state;
                    if (newLevel.tiles[y][x].groundId === '') delete newLevel.tiles[y][x].groundId;
                    if (newLevel.tiles[y][x].groundDeco === '') delete newLevel.tiles[y][x].groundDeco;
                    if (newLevel.tiles[y][x].propId === '') delete newLevel.tiles[y][x].propId;
                    if (newLevel.tiles[y][x].propDeco === '') delete newLevel.tiles[y][x].propDeco;
                    if (newLevel.tiles[y][x].itemId === '') delete newLevel.tiles[y][x].itemId;
                    if (newLevel.tiles[y][x].effectId === '') delete newLevel.tiles[y][x].effectId;
                }
            }
            ret.tiles = newLevel.tiles;
            let mobs_ = [];
            newLevel.mobs.forEach(function (newMob) {
                for(let itVision in newMob.onVisionCharacters){
                  if(newMob.onVisionCharacters[itVision]){
                    mobs_.push(newMob);
                  }
                }
            }, this);
            if (mobs_.length > 0) ret.mobs = mobs_;
        }
        if (Object.getOwnPropertyNames(ret).length > 0) {
            // only returns ret if not empty
            return ret;
        }
        // otherwise, no return = undefined
    },

    moveHeroesToEntrance: function () {
        let entrance = this.getEntrance();
        gameEngine.heros.forEach(function (hero) {
            hero.position = entrance;
        }, this);
    },

    moveHeroesToExit: function () {
        let exit = this.getExit();
        gameEngine.heros.forEach(function (hero) {
            hero.position = exit;
        }, this);
    },
    
    getEntrance: function () {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let behavior = this.tiles[y][x].behavior;
                if (typeof behavior !== 'undefined' && typeof behavior.move !== 'undefined' && typeof behavior.move.callback !== 'undefined' && behavior.move.callback === 'jumpToPreviousLevel') {
                    return this.tiles[y][x];
                }
            }
        }
    },
    
    getExit: function () {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let behavior = this.tiles[y][x].behavior;
                if (typeof behavior !== 'undefined' && typeof behavior.move !== 'undefined' && typeof behavior.move.callback !== 'undefined' && behavior.move.callback === 'jumpToNextLevel') {
                    return this.tiles[y][x];
                }
            }
        }
    },

    clean : function () {
        delete this.guid;
        delete this.mobs;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x].clean();
            }
        }
    }
};
