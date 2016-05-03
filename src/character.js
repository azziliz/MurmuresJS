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
      for(let xx=0;xx<level.width;xx++){
        for(let yy=0;yy<level.height;yy++){
          if(level.tiles[yy][xx].state==1){
            if(level.tiles[yy][xx].content!=1){
                level.tiles[yy][xx].state = 2;
            }
          }
        }
      }

      for(let i=0;i<360;i++)
      {
        let x = Math.cos(i*0.01745);
        let y = Math.sin(i*0.01745);
        let ox = this.position.x+0.5;
        let oy = this.position.y+0.5;
        for(let j=0;j<5;j++){
          level.tiles[Math.floor(oy)][Math.floor(ox)].state = 1;
          if (level.tiles[Math.floor(oy)][Math.floor(ox)].content == 1){
            break;
          }
          ox += x;
          oy += y;
        }
      };

    };

})(this);
