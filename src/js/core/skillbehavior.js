'use strict';
//debugger;

/**
 * @file SkillBehavior class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * This class contains behaviors of the different skill.
 * The aim is to have a generic class, with static function receiving parameters to apply skill from source to target.
 * Mainly the skill would be applied to characters (attack, ranged-attack, healing spell, ...).
 *
 * @class
 */
murmures.SkillBehavior = {
  attack : function (source,target,skillTplate,params){
    if(skillTplate.custom.damage !== "undefined"){
        target.hitPoints -= skillTplate.custom.damage;
        murmures.serverLog("Hiiiit");
      return true;
    }
    return false;
  },

  checkAttack : function(source,target,skillTplate,params){
    if(skillTplate.range !== "undefined"){
      if (Math.abs(target.x - source.position.x) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if (Math.abs(target.y - source.position.y) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      return {valid :true};
    }

    return {valid :false, reason :'bad skill applied'};
  },

  heal : function (source,target,skillTplate,params){
    if(skillTplate.custom.heal !== "undefined"){
      target.hitPoints += skillTplate.custom.heal;
      return true;
    }
    return false;
  },

  checkHeal : function(source,target,skillTplate,params){
    if(skillTplate.range !== "undefined"){
      if (Math.abs(target.x - source.position.x) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if (Math.abs(target.y - source.position.y) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      return {valid :true};
    }

    return {valid :false, reason :'bad skill applied'};
  }
};
