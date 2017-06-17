'use strict';
//debugger;

/**
 * @file Character class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * Characters are entities that live, move and act inside a [level]{@link murmures.Level}.
 *
 * Heroes are characters managed by the players.
 * They can be given [orders]{@link murmures.Order} on client side.
 * They can move from one level to another.
 * Mobs are characters managed by the AI.
 * The AI methods to control them are defined in the [game engine]{@link murmures.GameEngine} class.
 * They cannot change level.
 *
 * Three steps are mandatory to create a valid character:
 * 1. Load all character templates from mobs.json.
 * 2. Select templates that are needed for the current level.
 * 2. Use the "instantiate" method in the Character class to create new instances.
 * Step 1 is performed by the game engine during the server startup.
 * Step 2 and 3 are performed together by the server and the game engine when a level is loaded.
 *
 * @class
 */
murmures.Character = function () {
    /** @type {string} */
    this.guid = '';
    /** @type {murmures.Tile} */
    this.position = null;
    /** @type {string} */
    this.mobTemplate = '';
    /** @type {number} */
    this.hitPointsMax = 0 | 0;
    /** @type {Object.<string, boolean>} */
    this.onVisionCharacters = {};
    /** @type {number} */
    this.hitPoints = 0 | 0;
    /** @type {number} */
    this.range = 0 | 0;
    /** @type {number} */
    this.defaultDamageValue = 0 | 0;
    /** @type {boolean} */
    this.canMove = false; // unused for now
    /** @type {boolean} */
    this.charSpotted = false; // hero is known because seen at least once
    /** @type {number} */
    this.stateOrder = murmures.C.STATE_HERO_WAITING_FOR_ORDER;
    /** @type {Object.<integer, murmures.Skill>} */
    this.skills = {};
    /** @type {number} */
    this.activeSkill = 0;
    /** @type {number} */
    this.typeCharacter = murmures.C.TYPE_CHARACTER_MOB;
};

murmures.Character.prototype = {
    
    /**
     * It is expected that, when the server calls this function,
     * the Tile object in parameter is already built.
     */
    build : function (tile, template) {
        this.guid = Math.random().toString();
        this.position = tile;
        this.mobTemplate = template;
        let ref = gameEngine.bodies[template];
        this.hitPointsMax = (ref.hitPointsMax || (this.isHero ? 20 : 10)) | 0; // by default, heroes start with 20 HP. Other mobs with 10. This can be changed in assets.json.
        this.hitPoints = this.hitPointsMax | 0;
        this.range = (ref.range || (this.isHero ? 3 : 2)) | 0; // by default, heroes start with a 3 tile range. Other mobs with 2. This can be changed in assets.json.
        this.defaultDamageValue = (ref.defaultDamageValue || (this.isHero ? 3 : 1)) | 0; // by default, heroes deal 3 damage per attack. Other mobs deal 1. This can be changed in assets.json.
        this.canMove = ref.canMove || false;
        this.charSpotted = ref.charSpotted || false;
        this.stateOrder = murmures.C.STATE_HERO_WAITING_FOR_ORDER;

    },
    
    initialize : function (src) {
        this.guid = src.guid;
        this.synchronize(src);
    },
    
    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.position !== 'undefined') this.move(src.position.x, src.position.y); // TODO position=null when mob becomes invisible?
        if (typeof src.mobTemplate !== 'undefined') this.mobTemplate = src.mobTemplate;
        if (typeof src.hitPointsMax !== 'undefined') this.hitPointsMax = src.hitPointsMax;
        if (typeof src.hitPoints !== 'undefined') this.hitPoints = src.hitPoints;
        if (typeof src.range !== 'undefined') this.range = src.range;
        if (typeof src.defaultDamageValue !== 'undefined') this.defaultDamageValue = src.defaultDamageValue;
        if (typeof src.canMove !== 'undefined') this.canMove = src.canMove;
        if (typeof src.charSpotted !== 'undefined') this.charSpotted = src.charSpotted;
        if (typeof src.stateOrder !== 'undefined') this.stateOrder = src.stateOrder;
        if (typeof src.onVisionCharacters !== 'undefined') this.onVisionCharacters = src.onVisionCharacters;
        if (typeof src.skills !== 'undefined') this.skills = src.skills;
        if (typeof src.activeSkill !== 'undefined') this.activeSkill = src.activeSkill;
        if (typeof src.typeCharacter !== 'undefined') this.typeCharacter = src.typeCharacter;
    },
    
    clone : function () {
        let beforeOnVisionCharacters = {};
        for (let itVision in this.onVisionCharacters) {
            beforeOnVisionCharacters[itVision] = this.onVisionCharacters[itVision];
        }
        return {
            guid: this.guid,
            position: this.position.coordinates,
            mobTemplate: this.mobTemplate,
            hitPointsMax: this.hitPointsMax,
            hitPoints: this.hitPoints,
            range: this.range,
            defaultDamageValue: this.defaultDamageValue,
            canMove: this.canMove,
            charSpotted: this.charSpotted,
            stateOrder : this.stateOrder,
            onVisionCharacters : beforeOnVisionCharacters,
        };
    },
    
    compare : function (beforeState) {
        let ret = {};
        if (this.guid !== beforeState.guid) throw 'Character changed guid. This souldn\'t be happening';
        if (this.position.x !== beforeState.position.x || this.position.y !== beforeState.position.y) ret.position = this.position.coordinates;
        if (this.mobTemplate !== beforeState.mobTemplate) ret.mobTemplate = this.mobTemplate;
        if (this.hitPointsMax !== beforeState.hitPointsMax) ret.hitPointsMax = this.hitPointsMax;
        if (this.hitPoints !== beforeState.hitPoints) ret.hitPoints = this.hitPoints;
        if (this.range !== beforeState.range) ret.range = this.range;
        if (this.defaultDamageValue !== beforeState.defaultDamageValue) ret.defaultDamageValue = this.defaultDamageValue;
        if (this.canMove !== beforeState.canMove) ret.canMove = this.canMove;
        if (this.stateOrder !== beforeState.stateOrder) ret.stateOrder = this.stateOrder;
        if (this.charSpotted !== beforeState.charSpotted) {
            // client discovers the mob for the first time --> send everything
            ret.position = this.position.coordinates;
            ret.mobTemplate = this.mobTemplate;
            ret.hitPointsMax = this.hitPointsMax;
            ret.hitPoints = this.hitPoints;
            ret.range = this.range;
            ret.defaultDamageValue = this.defaultDamageValue;
            ret.canMove = this.canMove;
            ret.charSpotted = this.charSpotted;
        }        
        
        for (let itMap in this.onVisionCharacters) {
            if (this.onVisionCharacters[itMap] !== beforeState.onVisionCharacters[itMap]) {
                ret.onVisionCharacters = this.onVisionCharacters;
                break;
            }
        }
        
        for (let prop in ret) {
            // only returns ret if not empty
            ret.guid = this.guid;
            return ret;
        }
        // otherwise, no return = undefined
    },
    
    move : function (x, y) {
        this.position = gameEngine.level.tiles[y][x];
    },
    
    get isHero() {
        let ref = gameEngine.bodies[this.mobTemplate];
        return murmures.C.LAYERS[ref.layerId][0] === 'Hero';
    },
    
    hasSkill : function (skillId) {
        for (let s in this.skills) {
            if (this.skills[s].id == parseInt(skillId)) {
                return true;
            }
        }
        return false;
    },
    
    setVision : function (tilesProcessed) {
        murmures.serverLog("hero position");
        let level = gameEngine.level;
        if (typeof tilesProcessed === 'undefined' || tilesProcessed === null) { tilesProcessed = []; }
        for (let xx=0; xx < level.width; xx++) {
            for (let yy=0; yy < level.height; yy++) {
                let toProceed = (tilesProcessed.indexOf(level.tiles[yy][xx]) < 0);
                if (toProceed) {
                    if (level.tiles[yy][xx].state === murmures.C.TILE_HIGHLIGHTED) {
                        level.tiles[yy][xx].state = murmures.C.TILE_FOG_OF_WAR;
                    }
                }
            }
        }
        
        for (let i=0; i < 360; i++) {
            let x = Math.cos(i * 0.01745);
            let y = Math.sin(i * 0.01745);
            let ox = this.position.x + 0.5;
            let oy = this.position.y + 0.5;
            let j=0;
            let breakObstacle = false;
            while ((j < murmures.C.DEFAULT_RANGE_FOV) && (breakObstacle === false)) {
                let oxx = 0;
                oxx = Math.floor(ox);
                let oyy = 0;
                oyy = Math.floor(oy);
                if ((oxx >= 0) && (oxx < level.width) && (oyy >= 0) && (oyy < level.height)) {
                    let toProceed = (tilesProcessed.indexOf(level.tiles[oyy][oxx]) < 0);
                    
                    let groundLight = (level.tiles[oyy][oxx].groundId === "") ? true : !gameEngine.bodies[level.tiles[oyy][oxx].groundId].hasPhysics ? true : !!gameEngine.bodies[level.tiles[oyy][oxx].groundId].allowFlying;
                    let propLight = (level.tiles[oyy][oxx].propId === "") ? true : !gameEngine.bodies[level.tiles[oyy][oxx].propId].hasPhysics ? true : !!gameEngine.bodies[level.tiles[oyy][oxx].propId].allowFlying;
                    if ((!groundLight || !propLight) && (j > 0)) {
                        breakObstacle = true;
                    }
                    for (let itMob=0; itMob < gameEngine.level.mobs.length; itMob++) {
                        let mob = gameEngine.level.mobs[itMob];
                        if (mob.position.y == oyy && mob.position.x == oxx) {
                            mob.charSpotted = true;
                            mob.onVisionCharacters[this.guid] = true;
                        }
                    }
                    for (let itHero=0; itHero < gameEngine.heros.length; itHero++) {
                        let hero = gameEngine.heros[itHero];
                        if (hero.position.y == oyy && hero.position.x == oxx) {
                            hero.onVisionCharacters[this.guid] = true;
                        }
                    }
                    
                    if (toProceed) {
                        level.tiles[oyy][oxx].state = murmures.C.TILE_HIGHLIGHTED;
                        tilesProcessed.push(level.tiles[oyy][oxx]);
                    }
                    
                    ox += x;
                    oy += y;
                } else {
                    breakObstacle = true;
                }
                j += 1;
            }
        }
        
        return tilesProcessed;
    }
};
