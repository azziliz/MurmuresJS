'use strict';

(function (client) {

    var character = function () {
        /// <field name="position" type="tile"/>
        /// <field name="hitPoints" type="Number"/>
        /// <field name="hitPointsMax" type="Number"/>
        /// <field name="img" type="String"/>
        /// <field name="name" type="String"/>
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        murmures.character = character;
    }

    character.prototype.fromJson = function (src) {
        /// <param name="src" type="character"/>
        this.position = src.position;
        this.hitPoints = src.hitPoints;
        this.hitPointsMax = src.hitPointsMax;
        this.img = src.img;
        this.name = src.name;
    };

    character.prototype.move = function (x, y) {
        this.position.x = x;
        this.position.y = y;
    };

    character.prototype.setVision = function(level){
      for(let i=-1;i<2;i++){
        for(let j=-1;j<2;j++){
          if((this.position.x+i>0) && (this.position.x+i<level.width) && (this.position.y+j>0) && (this.position.y+j<level.height)){
              level.tiles[this.position.y+j][this.position.x+i].state=1;
          }
        }
      }
    }

})(this);
