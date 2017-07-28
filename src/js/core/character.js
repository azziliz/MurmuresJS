/**
 * @file Character class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

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
    this.position = {};
    /** @type {string} */
    this.mobTemplate = '';
    /** @type {number} */
    this.hitPointsMax = 0;
    /** @type {Object.<string, boolean>} */
    this.onVisionCharacters = {};
    /** @type {number} */
    this.hitPoints = 0;
    /** @type {number} */
    this.range = 0;
    /** @type {number} */
    this.defaultDamageValue = 0;
    /** @type {boolean} */
    this.canMove = false; // unused for now
    /** @type {boolean} */
    this.charSpotted = false; // hero is known because seen at least once
    /** 
     * key is the skill name, as defined in skill.json
     * @type {Object.<string, murmures.Skill>} 
     */
    this.skills = {};
    /** @type {string} */
    this.activeSkill = '';
    /** @type {number} */
    this.dexterity = 0;
    /** @type {number} */
    this.intelligence = 0;
    /** @type {number} */
    this.strength = 0;
    /** @type {number} */
    this.initiative = 0;
};

murmures.Character.prototype = {
    
    /**
     * It is expected that, when the server calls this function,
     * the Tile object in parameter is already built.
     */
    build : function (tile, template, additionalSkills) {
        this.guid = murmures.Utils.newGuid();
        this.position = tile;
        this.mobTemplate = template;
        const ref = gameEngine.bodies[template];
        this.hitPointsMax = (ref.hitPointsMax || (this.isHero ? 20 : 10)) | 0; // by default, heroes start with 20 HP. Other mobs with 10. This can be changed in assets.json.
        this.hitPoints = this.hitPointsMax | 0;
        this.range = (ref.range || (this.isHero ? 3 : 2)) | 0; // by default, heroes start with a 3 tile range. Other mobs with 2. This can be changed in assets.json.
        this.defaultDamageValue = (ref.defaultDamageValue || (this.isHero ? 3 : 1)) | 0; // by default, heroes deal 3 damage per attack. Other mobs deal 1. This can be changed in assets.json.
        this.canMove = ref.canMove || false;
        this.charSpotted = ref.charSpotted || false;
        
        // Attributes
        this.intelligence = Math.floor(Math.random() * 10);
        this.dexterity = Math.floor(Math.random() * 10);
        this.strength = Math.floor(Math.random() * 10);
        this.initiative = this.dexterity;
        
        // Skills
        // Adds 'move' to each character
        // Then adds {additionalSkills} other skills. Usually: 1 for mobs ; 2 for heroes
        const guidArray = Object.keys(gameEngine.skills);
        const moveguid = guidArray[0];
        this.skills[moveguid] = gameEngine.skills[moveguid];
        this.activeSkill = moveguid;
        
        const skillLength = guidArray.length;
        do {
            const rand = Math.floor(Math.random() * skillLength);
            const skillGuid = guidArray[rand];
            if (!(skillGuid in this.skills)) {
                this.skills[skillGuid] = gameEngine.skills[skillGuid];
            }
        } while (Object.keys(this.skills).length <= additionalSkills);
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
        if (typeof src.onVisionCharacters !== 'undefined') this.onVisionCharacters = src.onVisionCharacters;
        if (typeof src.skills !== 'undefined') this.skills = src.skills;
        if (typeof src.activeSkill !== 'undefined') this.activeSkill = src.activeSkill;
        if (typeof src.dexterity !== 'undefined') this.dexterity = src.dexterity;
        if (typeof src.intelligence !== 'undefined') this.intelligence = src.intelligence;
        if (typeof src.strength !== 'undefined') this.strength = src.strength;
        if (typeof src.initiative !== 'undefined') this.initiative = src.initiative;
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
            onVisionCharacters : beforeOnVisionCharacters,
            dexterity : this.dexterity,
            intelligence : this.intelligence,
            strength : this.strength,
            initiative : this.initiative
        };
    },
    
    compare : function (beforeState) {
        let ret = {};
        if (this.guid !== beforeState.guid) throw 'Character changed guid. This souldn\'t be happening';
        if (this.position.x !== beforeState.position.x || this.position.y !== beforeState.position.y) ret.position = this.position.coordinates;
        if (this.mobTemplate !== beforeState.mobTemplate) ret.mobTemplate = this.mobTemplate;
        if (this.hitPointsMax !== beforeState.hitPointsMax) ret.hitPointsMax = this.hitPointsMax;
        if (this.hitPoints !== beforeState.hitPoints) ret.hitPoints = this.hitPoints;
        if (this.dexterity !== beforeState.dexterity) ret.dexterity = this.dexterity;
        if (this.intelligence !== beforeState.intelligence) ret.intelligence = this.intelligence;
        if (this.strength !== beforeState.strength) ret.strength = this.strength;
        if (this.initiative !== beforeState.initiative) ret.initiative = this.initiative;
        if (this.range !== beforeState.range) ret.range = this.range;
        if (this.defaultDamageValue !== beforeState.defaultDamageValue) ret.defaultDamageValue = this.defaultDamageValue;
        if (this.canMove !== beforeState.canMove) ret.canMove = this.canMove;
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
        if (Object.getOwnPropertyNames(ret).length > 0) {
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
        const ref = gameEngine.bodies[this.mobTemplate];
        return murmures.C.LAYERS[ref.layerId][0] === 'Hero';
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
                        if (mob.position.y === oyy && mob.position.x === oxx) {
                            mob.charSpotted = true;
                            mob.onVisionCharacters[this.guid] = true;
                        }
                    }
                    for (let itHero=0; itHero < gameEngine.heros.length; itHero++) {
                        let hero = gameEngine.heros[itHero];
                        if (hero.position.y === oyy && hero.position.x === oxx) {
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
    },
    
    applyAI : function () {
        const order1 = new murmures.Order();

        let ret={}; // TODO : report queue ?
        const heros = gameEngine.heros;
        if (this.charSpotted) {
            let fireOnHero = false;
            for (let itHero = 0; itHero < heros.length; itHero++) {
                if (this.onVisionCharacters[heros[itHero].guid]) {
                    if (Math.abs(this.position.x - heros[itHero].position.x) <= this.range && Math.abs(this.position.y - heros[itHero].position.y) <= this.range && this.hitPoints > 0) {
                        if (typeof ret.reportQueue === "undefined") ret.reportQueue = [];
                        let tr1 = new murmures.TurnReport();
                        tr1.build({
                            effect: 'projectileMove',
                            sourceTile: this.position.coordinates,
                            targetTile: heros[itHero].position.coordinates,
                            priority: 120
                        });
                        ret.reportQueue.push(tr1);
                        let tr2 = new murmures.TurnReport();
                        tr2.build({
                            effect: 'damage',
                            character: heros[itHero],
                            value: this.defaultDamageValue,
                            priority: 130
                        });
                        ret.reportQueue.push(tr2);
                        //heros[itHero].hitPoints -= this.defaultDamageValue;
                        order1.command = 'attack';
                        order1.source = this;
                        order1.target = heros[itHero].position;
                        fireOnHero = true;
                        //if (heros[itHero].hitPoints <= 0) {
                        //    heros[itHero].hitPoints = 0;
                        //    ret.state = murmures.C.STATE_ENGINE_DEATH;
                        //}
                        break;
                    }
                }
            }
            
            if (!fireOnHero) {
                let myPath = new murmures.Pathfinding();
                //TODO move to hero spotted : onVisionCharacters
                let heroToGo=undefined;
                let distance=-1;
                for (let h in this.onVisionCharacters) {
                    if (this.onVisionCharacters[h] == true) {
                        for (let itHero=0; itHero < heros.length; itHero++) {
                            if (heros[itHero].guid == h) {
                                // TO DO : factorize CalculateDistance
                                let a = Math.abs(this.position.x - heros[itHero].position.x);
                                a *= a;
                                let b = Math.abs(this.position.y - heros[itHero].position.y);
                                b *= b;
                                let distCal = Math.sqrt(a + b);
                                if (distance == -1 || distance > distCal) {
                                    distance = distCal;
                                    heroToGo = heros[itHero];
                                }
                                break;
                            }
                        }
                    }
                    
                    if (typeof heroToGo !== "undefined") {
                        myPath.compute(gameEngine.level.tiles[this.position.y][this.position.x] , gameEngine.level.tiles[heroToGo.position.y][heroToGo.position.x], { allowTerrestrial : true });
                        if (myPath.path.length > 1) {
                            order1.command = 'move';
                            order1.source = this;
                            order1.target = gameEngine.level.tiles[myPath.path[myPath.path.length - 2].y][myPath.path[myPath.path.length - 2].x];
                            //this.move(order.target.x, order.target.y);
                        }
                    }
                }
            }
        }else{
            order1.command = 'wait';
            order1.source = this;
            order1.target = this.position;
        }
        return order1;
    }
};
