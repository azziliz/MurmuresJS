/**
 * @file Order class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * An order is a player-generated instruction or event.
 *
 * It is sent from the client to the server by an asynchronous request.
 * It contains a "command" field, which describes the type of the order, and various parameters.
 * Currently allowed commands are: "move" and "attack".
 * The list of allowed commands is expected to grow in the future.
 *
 * Orders validity is enforced by a GameEngine method called "checkOrder".
 * Every time an existing command is modified or a new command is created, the checkOrder method should be updated.
 *
 * The server responds to an order by sending the new gameEngine state, after the command is executed.
 *
 * @class
 */
murmures.Order = function () {
    /** @type {string} */
    this.command = '';
    /** @type {murmures.Character} */
    this.source = {};
    /** @type {murmures.Tile} */
    this.target = {};
};

murmures.Order.prototype = {
    /*
     * This class doesn't have initialize and synchronize methods because the server doesn't send orders to the client.
     * Hence no need to rebuild order objects on client side.
     */

    /**
     * Synchronization method called on server side only.
     * Creates a full Order object from a JSON.
     * This function is considered "safe" because it doesn't try to rebuild objects directly from the source.
     * Instead, it reads the client data and builds an Order object refering only to other server objects.
     *
     * @param {Object} src - A parsed version of the stringified remote order.
     */
    build : function (src) {
        this.command = src.command;
        this.source = undefined;
        for (let itHero = 0; itHero < gameEngine.heros.length; itHero++) {
            if (gameEngine.heros[itHero].guid === src.source.guid) {
                this.source = gameEngine.heros[itHero];
                if (typeof src.source.activeSkill !== 'undefined') {
                    gameEngine.heros[itHero].activeSkill = src.source.activeSkill;
                }
                break;
            }
        }
        
        if (typeof this.source === 'undefined') {
            murmures.serverLog("Tech Error - Guid does not match any heroes- " + src.source.guid);
            return { valid: false, reason: 'Technical error - Guid does not match - Please refresh the page' };
        }
        if (typeof src.target !== 'undefined') {
            this.target = gameEngine.level.tiles[src.target.y | 0][src.target.x | 0];
        }
        return { valid: true };
    },
    
    clean: function () {
        this.source = { guid: this.source.guid, activeSkill : this.source.activeSkill };
        this.target = { x: this.target.x, y: this.target.y };
    },

    apply : function () {
        // This function is only called on server side
        if (this.command === 'move') {
            if (typeof this.target.behavior !== 'undefined' && typeof this.target.behavior.move !== 'undefined') {
                murmures.Behavior[this.target.behavior.move.callback](this.source, this.target, this.target.behavior.move.params);
            } else {
                let tr1 = new murmures.TurnReport();
                tr1.build({
                    effect: 'characterMove',
                    character: this.source,
                    sourceTile: this.source.position.coordinates,
                    targetTile: this.target.coordinates,
                    priority: 10
                });
                gameEngine.reportQueue.push(tr1);
                this.source.move(this.target.x, this.target.y);
            }
        } else if (this.command === 'attack') {
            //TODO : two foreach for same thing but once on mobs, second on hero... certainly a better way to do this
            if ([murmures.C.TARGET_AUDIENCE_ALL, murmures.C.TARGET_AUDIENCE_MOB].indexOf(this.source.skills[this.source.activeSkill].targetaudience) >= 0) {
                gameEngine.level.mobs.forEach(function (mob) {
                    if (mob.onVisionCharacters[this.source.guid] && mob.position.x === this.target.x && mob.position.y === this.target.y) {
                        let tr1 = new murmures.TurnReport();
                        tr1.build({
                            effect: 'projectileMove',
                            sourceTile: this.source.position.coordinates,
                            targetTile: this.target.coordinates,
                            priority: 20
                        });
                        gameEngine.reportQueue.push(tr1);
                        let tr2 = new murmures.TurnReport();
                        tr2.build({
                            effect: 'damage',
                            character: mob,
                            value: this.source.defaultDamageValue,
                            priority: 30
                        });
                        gameEngine.reportQueue.push(tr2);
                        
                        this.source.skills[this.source.activeSkill].apply(mob);
                        if (mob.hitPoints <= 0) {
                            mob.hitPoints = 0;
                            mob.position.groundDeco = '_b1_02_blood_red00';
                        }
                    }
                }, this);
            }
            if ([murmures.C.TARGET_AUDIENCE_ALL, murmures.C.TARGET_AUDIENCE_HERO].indexOf(this.source.skills[this.source.activeSkill].targetaudience) >= 0) {
                gameEngine.heros.forEach(function (mob) {
                    if (mob.onVisionCharacters[this.source.guid] && mob.position.x === this.target.x && mob.position.y === this.target.y) {
                        this.source.skills[this.source.activeSkill].apply(mob);
                    }
                }, this);
            }
        }
        murmures.serverLog('Moves / attacks done');
        for (let itMob=0; itMob < gameEngine.level.mobs.length; itMob++) {
            for (let itHero=0; itHero < gameEngine.heros.length; itHero++) {
                gameEngine.level.mobs[itMob].onVisionCharacters[gameEngine.heros[itHero].guid] = false;
            }

        }
        let tilesProcessed = [];
        for (let itHero = 0; itHero < gameEngine.heros.length ; itHero++) {
            if (typeof tilesProcessed === 'undefined') {
                tilesProcessed = [];
            }
            tilesProcessed = gameEngine.heros[itHero].setVision(tilesProcessed);
        }
        murmures.serverLog('Vision done');
    },

};
