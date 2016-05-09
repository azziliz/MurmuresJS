'use strict';

//debugger;

murmures.Level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="heroStartingTiles" type="Tile"/>
        /// <field name="mobStartingTiles" type="Tile"/>
};

murmures.Level.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.heroStartingTiles = [];
        this.mobStartingTiles = [];
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile();
                this.tiles[y][x].fromJson(src.tiles[y][x], x, y);
                if (this.tiles[y][x].charId !== '') {
                    let ref = gameEngine.mobsReference[this.tiles[y][x].charId];
                    if (ref.isHero) {
                        this.heroStartingTiles.push(this.tiles[y][x]);
                    } 
                    else {
                        this.mobStartingTiles.push(this.tiles[y][x]);
                    }
                }
            }
        }
    },
    
    clean : function () {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                delete this.tiles[y][x].x;
                delete this.tiles[y][x].y;
                delete this.tiles[y][x].state;
                delete this.tiles[y][x].heroStartingTiles;
                delete this.tiles[y][x].mobStartingTiles;
                if (this.tiles[y][x].groundId === '') delete this.tiles[y][x].groundId;
                if (this.tiles[y][x].propId === '') delete this.tiles[y][x].propId;
                if (this.tiles[y][x].charId === '') delete this.tiles[y][x].charId;
            }
        }
    },
    
    isWall : function (tile) {
        /// <param name="tile" type="Tile"/>
        let allowTerrestrialGround = (this.tiles[tile.y][tile.x].groundId === "") ? true : gameEngine.bodies[this.tiles[tile.y][tile.x].groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.tiles[tile.y][tile.x].propId === "") ? true : gameEngine.bodies[this.tiles[tile.y][tile.x].propId].allowTerrestrial;
        return !allowTerrestrialGround || !allowTerrestrialProp;
    }
};

