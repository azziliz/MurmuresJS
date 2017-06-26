'use strict';
//debugger;

/**
 * @file Skill class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * A skill is a template grab from global skill.json
 * It contains standard properties as id, but contains too, some custom not determined at skill definition
 * This custom properties are the specific part of skill, to manage a single class, with few different attributes between skills
 * An attack skill will have a damage custom attributes, whereas a healing skill, will have a heal custom attributes.
 *
 * A skill has two behavior function, one, which will check if the skill can be applied, second which will be applied in case of validation
 *
 * targetaudience defines if the skill can be applied on a mob, hero, (item) or everything
 *
 * @class
 */

murmures.Skill = function () {
    /** @type {number} */
    this.id = '';
    /** @type {string} */
    this.name = '';
    /** @type {string} */
    this.typeeffect = '';
    /** @type {number} */
    this.modifier = 0;
    /** @type {number} */
    this.range = 0;
    /** @type {number} */
    this.targetaudience = 0;
    /** @type {string} */
    this.asset = '';
};

murmures.Skill.prototype = {
    build : function (src, name) {
        this.id = src.id;
        this.name = name;
        this.typeeffect = src.typeeffect;
        this.modifier = src.modifier;
        this.range = src.range;
        this.targetaudience = src.targetaudience;
        this.asset = src.asset;
    },
    
    apply : function (target) {
        if (this.typeeffect === 'hpmodifier') {
            target.hitPoints = (target.hitPoints + this.modifier) < 0 ? 0:((target.hitPoints + this.modifier) > target.hitPointsMax ? target.hitPointsMax : (target.hitPoints + this.modifier));
        }
    },
};
