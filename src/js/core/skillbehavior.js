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

  /*
  * Function designed for standard attack
  * Apply standard damage to target
  */
  attack : function (source,target,skillTplate,params){
    if(target.typeCharacter == murmures.C.TYPE_CHARACTER_MOB){
      if(skillTplate.custom.damage !== "undefined"){
          target.hitPoints -= skillTplate.custom.damage;
        return true;
      }
    }
    return false;
  },

  /*
  * Use to check if standard attack can be done (range test)
  *
  */
  checkAttack : function(source,target,skillTplate,params){
    if(skillTplate.range !== "undefined"){
      if (Math.abs(target.x - source.position.x) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if (Math.abs(target.y - source.position.y) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if(target.typeCharacter == murmures.C.TYPE_CHARACTER_HERO) return {valid : false, reason: 'Invalid target. Target must be a mob'};
      return {valid :true};
    }

    return {valid :false, reason :'bad skill applied'};
  },


  /*
  * Function to resolve standard heal skill
  */
  heal : function (source,target,skillTplate,params){
    if(target.typeCharacter == murmures.C.TYPE_CHARACTER_HERO){
      if(skillTplate.custom.heal !== "undefined"){
        target.hitPoints += skillTplate.custom.heal;
        target.hitPoints = target.hitPoints > target.hitPointsMax ? target.hitPointsMax : target.hitPoints;
        return true;
      }
    }
    return false;
  },

  /*
  * Function to check if standard heal can be applied
  */

  checkHeal : function(source,target,skillTplate,params){
    if(skillTplate.range !== "undefined"){
      if (Math.abs(target.x - source.position.x) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if (Math.abs(target.y - source.position.y) > skillTplate.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillTplate.range };
      if(target.typeCharacter == murmures.C.TYPE_CHARACTER_MOB) return {valid : false, reason: 'Invalid target. Target must be an hero'};
      return {valid :true};
    }

    return {valid :false, reason :'bad skill applied'};
  }
};
