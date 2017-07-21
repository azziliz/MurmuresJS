/**
 * @file Tile class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * A tile is a square on the game grid.
 *
 * It is rendered on client side by drawing several overlapping layers, each layer being one PNG image from the murmures tileset.
 * For static levels created by the editor, each tile of a given layer is initialized
 * with a reference to the [physical body]{@link murmures.PhysicalBody} that is present on the tile.
 * The physical properties of these bodies may restrict movement and actions on the tile.
 *
 * A tile may contain at most one character.
 *
 * @class
 */
murmures.Tile = function (x, y) {
    /* No guid on Tile because tiles are always part of a level and we can identify a tile inside a level with (x, y)*/
    /** @type {number} */
    this.x = x | 0;
    /** @type {number} */
    this.y = y | 0;
    /** @type {number} */
    this.state = murmures.C.TILE_NOT_DISCOVERED | 0;
    /** @type {string} */
    this.groundId = '';
    /** @type {string} */
    this.groundDeco = '';
    /** @type {string} */
    this.propId = '';
    /** @type {string} */
    this.propDeco = '';
    /** @type {string} */
    this.itemId = '';
    /** @type {string} */
    this.charId = '';
    /** @type {string} */
    this.effectId = '';
    /** @type {Object.<string, Object.<string, string>>} */
    this.behavior = {};
};

murmures.Tile.prototype = {

    build : function (src) {
        // TODO: allow undefined layers
        this.groundId = (typeof src.groundId === 'undefined') ? '' : src.groundId;
        this.groundDeco = (typeof src.groundDeco === 'undefined') ? '' : src.groundDeco;
        this.propId = (typeof src.propId === 'undefined') ? '' : src.propId;
        this.propDeco = (typeof src.propDeco === 'undefined') ? '' : src.propDeco;
        this.itemId = (typeof src.itemId === 'undefined') ? '' : src.itemId;
        this.charId = (typeof src.charId === 'undefined') ? '' : src.charId;
        this.effectId = (typeof src.effectId === 'undefined') ? '' : src.effectId;
        this.behavior = (typeof src.propId === 'undefined' || src.propId === '') ? {} : gameEngine.bodies[src.propId].behavior;
    },

    initialize : function (src) {
        this.synchronize(src);
    },

    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.state !== 'undefined') this.state = src.state;
        if (typeof src.groundId !== 'undefined') this.groundId = src.groundId;
        if (typeof src.groundDeco !== 'undefined') this.groundDeco = src.groundDeco;
        if (typeof src.propId !== 'undefined') this.propId = src.propId;
        if (typeof src.propDeco !== 'undefined') this.propDeco = src.propDeco;
        if (typeof src.itemId !== 'undefined') this.itemId = src.itemId;
        if (typeof src.charId !== 'undefined') this.charId = src.charId; // level editor needs this so we send it but it also lets clients cheat. TODO: find a clean way to hide this to clients.
        if (typeof src.effectId !== 'undefined') this.effectId = src.effectId;
        if (typeof src.behavior !== 'undefined') this.behavior = src.behavior;
    },

    clone : function () {
        return {
            state: this.state,
            groundId: this.groundId,
            groundDeco: this.groundDeco,
            propId: this.propId,
            propDeco: this.propDeco,
            itemId: this.itemId,
            effectId: this.effectId,
            behavior: this.behavior,
        };
    },

    compare : function (beforeState) {
        let ret = {};
        if (this.state !== beforeState.state) ret.state = this.state;
        if (this.groundId !== beforeState.groundId) ret.groundId = this.groundId;
        if (this.groundDeco !== beforeState.groundDeco) ret.groundDeco = this.groundDeco;
        if (this.propId !== beforeState.propId) ret.propId = this.propId;
        if (this.propDeco !== beforeState.propDeco) ret.propDeco = this.propDeco;
        if (this.itemId !== beforeState.itemId) ret.itemId = this.itemId;
        if (this.effectId !== beforeState.effectId) ret.effectId = this.effectId;
        if (this.propId !== beforeState.propId &&
        JSON.stringify(this.behavior) !== JSON.stringify(beforeState.behavior)) ret.behavior = this.behavior;
        if (Object.getOwnPropertyNames(ret).length > 0) {
            // only returns ret if not empty
            ret.x = this.x;
            ret.y = this.y;
            return ret;
        }
        // otherwise, no return = undefined
    },

    get coordinates() {
        return { x: this.x, y: this.y };
    },

    clean: function () {
        delete this.x;
        delete this.y;
        delete this.state;
        delete this.behavior;
        if (this.groundId === '') delete this.groundId;
        if (this.groundDeco === '') delete this.groundDeco;
        if (this.propId === '') delete this.propId;
        if (this.propDeco === '') delete this.propDeco;
        if (this.itemId === '') delete this.itemId;
        if (this.charId === '') delete this.charId;
        if (this.effectId === '') delete this.effectId;
    },

    get hasMob() {
        let ret = false;
        let retMob = null;
        let heroRet = false;
        if (typeof gameEngine.level.mobs !== 'undefined') {
            gameEngine.level.mobs.forEach(function (mob) {
                if (mob.position.x === this.x && mob.position.y === this.y && mob.hitPoints > 0) {
                    ret = true;
                    retMob = mob;
                    heroRet = false;
                }
            }, this);
            gameEngine.heros.forEach(function (mob) {
                if (mob.position.x === this.x && mob.position.y === this.y && mob.hitPoints > 0) {
                    ret = true;
                    retMob = mob;
                    heroRet = true;
                }
            }, this);
        }
        return { code : ret, mob : retMob, isHero : heroRet };
    },

    isWall : function () {
        let allowTerrestrialGround = (this.groundId === "") ? true : !gameEngine.bodies[this.groundId].hasPhysics ? true : !!gameEngine.bodies[this.groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.propId === "") ? true : !gameEngine.bodies[this.propId].hasPhysics ? true : !!gameEngine.bodies[this.propId].allowTerrestrial;
        let hasMoveBehavior = (typeof this.behavior !== 'undefined' && typeof this.behavior.move !== 'undefined');
        return (!allowTerrestrialGround || !allowTerrestrialProp) && !hasMoveBehavior;
    },

    isPlaneBlocker: function (plane) {
        let groundPlanes;
        if (this.groundId === '') {
            groundPlanes = {
                allowFlying: true,
                allowTerrestrial: true,
                allowAquatic: true,
                allowUnderground: true,
                allowEthereal: true,
            };
        } else {
            const groundBody = gameEngine.bodies[this.groundId];
            if (!groundBody.hasPhysics) {
                groundPlanes = {
                    allowFlying: true,
                    allowTerrestrial: true,
                    allowAquatic: true,
                    allowUnderground: true,
                    allowEthereal: true,
                };
            } else {
                groundPlanes = {
                    allowFlying: !!groundBody.allowFlying,
                    allowTerrestrial: !!groundBody.allowTerrestrial,
                    allowAquatic: !!groundBody.allowAquatic,
                    allowUnderground: !!groundBody.allowUnderground,
                    allowEthereal: !!groundBody.allowEthereal,
                };
            }
        }
        let propPlanes;
        if (this.propId === '') {
            propPlanes = {
                allowFlying: true,
                allowTerrestrial: true,
                allowAquatic: true,
                allowUnderground: true,
                allowEthereal: true,
            };
        } else {
            const propBody = gameEngine.bodies[this.propId];
            if (!propBody.hasPhysics) {
                propPlanes = {
                    allowFlying: true,
                    allowTerrestrial: true,
                    allowAquatic: true,
                    allowUnderground: true,
                    allowEthereal: true,
                };
            } else {
                propPlanes = {
                    allowFlying: !!propBody.allowFlying,
                    allowTerrestrial: !!propBody.allowTerrestrial,
                    allowAquatic: !!propBody.allowAquatic,
                    allowUnderground: !!propBody.allowUnderground,
                    allowEthereal: !!propBody.allowEthereal,
                };
            }
        }
        if (plane.allowFlying && groundPlanes.allowFlying && propPlanes.allowFlying) return false;
        if (plane.allowTerrestrial && groundPlanes.allowTerrestrial && propPlanes.allowTerrestrial) return false;
        if (plane.allowAquatic && groundPlanes.allowAquatic && propPlanes.allowAquatic) return false;
        if (plane.allowUnderground && groundPlanes.allowUnderground && propPlanes.allowUnderground) return false;
        if (plane.allowEthereal && groundPlanes.allowEthereal && propPlanes.allowEthereal) return false;
        const hasMoveBehavior = (typeof this.behavior !== 'undefined' && typeof this.behavior.move !== 'undefined');
        if (hasMoveBehavior) return false;
        return true;
    },
};
