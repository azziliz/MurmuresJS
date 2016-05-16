'use strict';

//debugger;

murmures.GameEngine = function () {
        /// <field name="tileSize" type="Number"/>
        /// <field name="bodies" type="PhysicalBody"/>
        /// <field name="mobsReference" type="Character"/>
        /// <field name="level" type="Level"/>
        /// <field name="hero" type="Character"/>
        /// <field name="mobs" type="Character"/>
};

murmures.GameEngine.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="GameEngine"/>
        this.tileSize = src.tileSize;
        this.bodies = src.bodies;
        this.mobsReference = src.mobsReference;
        this.level = new murmures.Level();
        this.level.fromJson(src.level);
        this.hero = new murmures.Character();
        this.hero.fromJson(src.hero);

        let mobsarray = [];
        src.mobs.forEach(function (mob) {
            let charmob = new murmures.Character();
            charmob.fromJson(mob);
            mobsarray.push(charmob);
        });
        this.mobs = mobsarray;
        this.hero.setVision();
    },

    loadMobs : function () {
        let mobsarray = [];
        this.level.mobStartingTiles.forEach(function (startingTile) {
            let creature = new murmures.Character();
            creature.position = new murmures.Tile();
            creature.position.x = startingTile.x;
            creature.position.y = startingTile.y;
            creature.mobTemplate = startingTile.charId;
            creature.instanciate(this.mobsReference[startingTile.charId]);
            mobsarray.push(creature);
        }, this);
        this.mobs = mobsarray;
    },

    checkOrder : function (order) {
        /// <param name="order" type="Order"/>
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move' && order.command !== 'attack') return { valid: false, reason: 'Order contains an unknown command' };
        else if ((order.source.position.x !== this.hero.position.x) || (order.source.position.y !== this.hero.position.y)) return { valid: false, reason: 'You can only give orders to your own hero' };
        else if (this.level.isWall(order.target)) return { valid: false, reason: 'You cannot target a wall' };

        else if (order.command === 'attack' && Math.abs(order.target.x - this.hero.position.x) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && Math.abs(order.target.y - this.hero.position.y) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && !this.tileHasMob(order.target)) return { valid: false, reason: 'You cannot attack an empty tile' };
        else if (order.command === 'attack') return { valid: true, hasMob: true };

        else if (order.command === 'move' && Math.abs(order.target.x - this.hero.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && Math.abs(order.target.y - this.hero.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && this.tileHasMob(order.target)) return { valid: false, reason: 'The target tile is occupied by a mob' };
        else return { valid: true, hasMob: false };
    },

    tileHasMob : function (tile) {
        let ret = false;
        this.mobs.forEach(function (mob) {
            if (mob.position.x === tile.x && mob.position.y === tile.y && mob.hitPoints > 0) ret = true;
        });
        return ret;
    },

    applyOrder : function (order) {
        if (order.command === "move") {
            this.hero.move(order.target.x, order.target.y);
            this.hero.setVision();
        }
        else {
            this.mobs.forEach(function (mob) {
                if (mob.position.x === order.target.x && mob.position.y === order.target.y) {
                    mob.hitPoints -= 3;
                    if (mob.hitPoints < 0) mob.hitPoints = 0;
                }
            });
        }
        this.applyAI();
    },

    applyAI : function () {
        let hero = this.hero;
        let level = this.level;
        let bodies = this.bodies;
        this.mobs.forEach(function (mob) {
            if (mob.charSpotted == true){
              let fireOnHero = false;
              if (mob.onVision == true){
                if (Math.abs(mob.position.x - hero.position.x) <= 2 && Math.abs(mob.position.y - hero.position.y) <= 2 && mob.hitPoints > 0) {
                      hero.hitPoints -= 1;
                      fireOnHero = true;
                      if (hero.hitPoints < 0) hero.hitPoints = 0;
                 }
                
              }
              if (fireOnHero == false) {
                // TODO : move to hero
              }
            }
        });
    }
};
