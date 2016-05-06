'use strict';

(function (client) {

    var character = function () {
        /// <field name="position" type="tile"/>
        /// <field name="hitPoints" type="Number"/>
        /// <field name="hitPointsMax" type="Number"/>
        /// <field name="img" type="String"/>
        /// <field name="name" type="String"/>
        /// <field name="mobTemplate" type="String"/>
        this.charSpotted=false;
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
        this.mobTemplate = src.mobTemplate;
    };

    character.prototype.move = function (x, y) {
        this.position.x = x;
        this.position.y = y;
    };

    character.prototype.setVision = function(gameEngine){
      let level = gameEngine.level;
      
      for(let xx=0;xx<level.width;xx++){
        for(let yy=0;yy<level.height;yy++){
          if(level.tiles[yy][xx].state==1){
            if(level.tiles[yy][xx].content!=1){
                level.tiles[yy][xx].state = 2;
            }
          }
        }
      }

      for(let i=0;i<360;i++){
        let x = Math.cos(i*0.01745);
        let y = Math.sin(i*0.01745);
        let ox = this.position.x+0.5;
        let oy = this.position.y+0.5;
        for(let j=0;j<5;j++){
          let oxx = 0;
          oxx = Math.floor(ox);
          let oyy = 0;
          oyy = Math.floor(oy);
          if((oxx>=0) && (oxx<level.width) && (oyy>=0) && (oyy<level.height)){
            level.tiles[oyy][oxx].state = 1;
            for(let itMob=0;itMob<gameEngine.mobs.length;itMob++){
                let mob = gameEngine.mobs[itMob];
                if(mob.position.x==oxx && mob.position.y == oyy){
                  mob.charSpotted = true;
                }
              }
            if (level.tiles[oyy][oxx].content == 1){
              break;
            }
            ox += x;
            oy += y;
          }
        }
      }
    };

})(this);
