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
 * Heroes are characters managed by the players. They can be given [orders]{@link murmures.Order} on client side.
 * They can move from one level to another.
 * Mobs are characters managed by the AI. The AI methods to control them are defined in the [game engine]{@link murmures.GameEngine} class.
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
    /// <field name="guid" type="String"/>
    /// <field name="position" type="Tile"/>
    /// <field name="hitPoints" type="Number"/>
    /// <field name="hitPointsMax" type="Number"/>
    /// <field name="mobTemplate" type="String"/>
    this.charSpotted = false; // hero is known because seen at least once
    this.onVision = false; // hero is in isght of view
};

murmures.Character.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Character"/>
        this.guid = src.guid;
        this.position = src.position;
        this.hitPoints = src.hitPoints;
        this.hitPointsMax = src.hitPointsMax;
        this.mobTemplate = src.mobTemplate;
        this.onVision = src.onVision;
    },
    
    instantiate : function (mobReference) {
        this.guid = Math.random().toString();
        this.hitPointsMax = mobReference.hitPointsMax;
        this.hitPoints = mobReference.hitPointsMax;
    },
    
    move : function (x, y) {
        this.position.x = x;
        this.position.y = y;
    },
    
    setVision : function () {
        let level = gameEngine.level;
        
        for (let xx=0; xx < level.width; xx++) {
            for (let yy=0; yy < level.height; yy++) {
                if (level.tiles[yy][xx].state === murmures.C.TILE_HIGHLIGHTED) {
                    level.tiles[yy][xx].state = murmures.C.TILE_FOG_OF_WAR;
                }
            }
        }
        
        for (let itMob=0; itMob < gameEngine.level.mobs.length; itMob++) {
            gameEngine.level.mobs[itMob].onVision = false;
        }
        
        for (let i=0; i < 360; i++) {
            let x = Math.cos(i * 0.01745);
            let y = Math.sin(i * 0.01745);
            let ox = this.position.x + 0.5;
            let oy = this.position.y + 0.5;
            for (let j=0; j < 20; j++) {
                let oxx = 0;
                oxx = Math.floor(ox);
                let oyy = 0;
                oyy = Math.floor(oy);
                if ((oxx >= 0) && (oxx < level.width) && (oyy >= 0) && (oyy < level.height)) {
                    level.tiles[oyy][oxx].state = murmures.C.TILE_HIGHLIGHTED;
                    for (let itMob=0; itMob < gameEngine.level.mobs.length; itMob++) {
                        let mob = gameEngine.level.mobs[itMob];
                        if (mob.position.x === oxx && mob.position.y === oyy) {
                            mob.charSpotted = true;
                            mob.onVision = true;
                        }
                    }
                    let groundLight = (level.tiles[oyy][oxx].groundId === "") ? true : gameEngine.bodies[level.tiles[oyy][oxx].groundId].allowFlying;
                    let propLight = (level.tiles[oyy][oxx].propId === "") ? true : gameEngine.bodies[level.tiles[oyy][oxx].propId].allowFlying;
                    if ((!groundLight || !propLight) && (j > 0)) {
                        break;
                    }
                    ox += x;
                    oy += y;
                }
            }
        }
    }
};
