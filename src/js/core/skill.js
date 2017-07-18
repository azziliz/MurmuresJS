/**
 * @file Skill class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

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
    /** 
     * This is a unique identifier, defined in skill.json
     * @type {string} 
     */
    this.name = '';
    /** @type {string} */
    this.typeeffect = '';
    /** @type {number} */
    this.modifier = 0;
    /** 
     * Distance that the skill can reach around the caster
     * @type {number} 
     */
    this.range = 0;
    /** 
     * Time needed to activate the skill ; unit is 0.001s (so 'activation = 3500' means 3.5 seconds)
     * @type {number}
     */
    this.activation = 0;
    /**
     * What type of entity does the skill targets ? Can be a mob, a hero, the ground, ...
     * Usually contains a constant of the form TARGET_AUDIENCE_* defined in core/constants.js
     * @type {number}
     */
    this.targetaudience = 0;
    /** 
     * The skill icon. For consistency, this should reference an asset from layer 95, defined in assets.json.
     * @type {string}
     */
    this.asset = '';
};

murmures.Skill.prototype = {
    build : function (src, name) {
        this.name = name;
        this.typeeffect = src.typeeffect;
        this.modifier = src.modifier;
        this.range = src.range;
        this.activation = src.activation;
        this.targetaudience = src.targetaudience;
        this.asset = src.asset;
    },
    
    apply : function (target) {
        if (this.typeeffect === 'hpmodifier') {
            target.hitPoints = (target.hitPoints + this.modifier) < 0 ? 0:((target.hitPoints + this.modifier) > target.hitPointsMax ? target.hitPointsMax : (target.hitPoints + this.modifier));
        }
    },
};
