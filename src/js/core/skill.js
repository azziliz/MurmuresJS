'use strict';
//debugger;

/**
 * @file Tile class. Part of the MurmuresJS project.
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
 * A skill has has two behavior function, one, which will check if the skill can be applied, second which will be applied in case of validation
 *
 * The targetAudience is defined if the skill can be applied on a mob, hero, (item) or everything
 *
 * @class
 */

murmures.Skill = function () {
  this.id  = '';
  this.name = '';
  this.skillbehavior = {};
  this.typeeffect = '';
  this.modifer = '';
  this.range = 0;
  this.targetaudience = 0;
  this.asset = "";
};

murmures.Skill.prototype = {
    build : function (src,name) {
      /** @type {number} */
      this.id = src.id;
      /** @type {string} */
      this.name = name;
      /** @type {Object.<string, Object.<string, string>>} */
      this.skillbehavior = src.skillbehavior;
      this.typeeffect  = src.typeeffect;
      this.modifier = src.modifier;
      /** @type {number} */
      this.range = src.range;
      /** @type {number} */
      this.targetaudience = src.targetaudience;
      /** @type {string} */
      this.asset = src.asset;
    },
   apply : function (target){
     if(this.typeeffect === 'hpmodifier'){
       target.hitPoints = (target.hitPoints + this.modifier) < 0 ? 0:((target.hitPoints + this.modifier) > target.hitPointsMax ? target.hitPointsMax : (target.hitPoints + this.modifier));
     }
   }
};
