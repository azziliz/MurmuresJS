murmures.Skill = function () {
  this.id  = '';
  this.name = '';
  this.SkillBehavior = {};
  this.custom = {};
  this.range = 0;
};

murmures.Skill.prototype = {
    build : function (src,name) {
      this.id = src.id;
      this.name = name;
      this.SkillBehavior = src.skillbehavior;
      this.custom = src.custom;
      this.range = src.range;
    }
};
