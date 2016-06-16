murmures.Skill = function () {
  this.id  = '';
  this.name = '';
  this.skillbehavior = {};
  this.custom = {};
  this.range = 0;
  this.targetaudience = 0;
};

murmures.Skill.prototype = {
    build : function (src,name) {
      this.id = src.id;
      this.name = name;
      this.skillbehavior = src.skillbehavior;
      this.custom = src.custom;
      this.range = src.range;
      this.targetaudience = src.targetaudience;
    }
};
