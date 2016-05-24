'use strict';
//debugger;

/**
 * @file Level class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * Level is a class that contains all necessary information to build a new game zone.
 *
 * This includes the zone topology, defined by an array of [tiles]{@link murmures.Tile}, as well as the starting points for all [characters]{@link murmures.Character}.
 *
 * Static levels created by the editor are stored in JSON files, usually named /data/levelXX.json.
 * These files are in a "clean" state that contains only non-empty properties.
 * Missing tile layers and starting points are calculated when the level is loaded by the "fromJson" method.
 *
 * @class
 */
murmures.Level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="mobs" type="Array"/>
};

murmures.Level.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Level"/>

        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile();
                this.tiles[y][x].fromJson(src.tiles[y][x], x, y);
            }
        }

        this.mobs = [];
        if (typeof src.mobs !== "undefined") {
            // mobs array is only defined after the first call to instantiateMobs
            src.mobs.forEach(function (mob) {
                let charmob = new murmures.Character();
                charmob.fromJson(mob);
                this.mobs.push(charmob);
            }, this);
        }
    },

    mergeFromJson : function(src){
      for(let i=0;i<src.tiles.length;i++){
        this.tiles[src.tiles[i].y][src.tiles[i].x].state = src.tiles[i].state;
        if (src.tiles[i].needsClientUpdate == true){
         this.tiles[src.tiles[i].y][src.tiles[i].x].propId = src.tiles[i].propId;
          this.tiles[src.tiles[i].y][src.tiles[i].x].needsClientUpdate = true;
        }
      }
      //this.mobs = [];
      if (typeof src.mobs !== "undefined") {
          // mobs array is only defined after the first call to instantiateMobs
          src.mobs.forEach(function (mob) {
              let charmob = new murmures.Character();
              charmob.fromJson(mob);
              //this.mobs.push(charmob);
              for (let itMob=0;itMob<this.mobs.length;itMob++){
                if (this.mobs[itMob].guid == charmob.guid){
                  this.mobs[itMob] = charmob;
                }
              }
          }, this);
      }
      //this.mobs = src.mobs;
    },

    getMinimal : function(){
      let tilesArray = [];
      for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
              if(this.tiles[y][x].toUpdate === true){
                  tilesArray.push(this.tiles[y][x]);
                //  murmures.serverLog(JSON.stringify(this.tiles[y][x]));

              }
          }
      }

      let mobsTosend = [];
      for (let itMob=0;itMob<this.mobs.length;itMob++){
        if(this.mobs[itMob].toUpdate === true){
          mobsTosend.push(this.mobs[itMob]);
        }
      }


      return {tiles :tilesArray, mobs: mobsTosend};
    },

    instantiateMobs : function () {
        this.mobs = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].charId !== '') {
                    let ref = gameEngine.bodies[this.tiles[y][x].charId];
                    if (murmures.C.LAYERS[ref.layerId][0] !== 'Hero') {
                        let mob = new murmures.Character();
                        mob.position = this.tiles[y][x];
                        mob.mobTemplate = this.tiles[y][x].charId;
                        mob.instantiate(ref);
                        this.mobs.push(mob);
                    }
                }
            }
        }
    },

    moveHeroToStartingPoint: function () {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].charId !== '') {
                    let ref = gameEngine.bodies[this.tiles[y][x].charId];
                    if (murmures.C.LAYERS[ref.layerId][0] === 'Hero') {
                        gameEngine.hero.position = this.tiles[y][x];
                    }
                }
            }
        }
    },

    clean : function () {
        delete this.mobs;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x].clean();
            }
        }
    }
};
