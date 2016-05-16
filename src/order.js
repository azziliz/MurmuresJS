'use strict';

//debugger;

murmures.Order = function () {
        /// <field name="command" type="String"/>
        /// <field name="source" type="Character"/>
        /// <field name="target" type="Tile"/>
};

murmures.Order.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Order"/>
        this.command = src.command;
        this.source = src.source;
        this.target = new murmures.Tile();
        this.target.fromJson(src.target);
    }, 

    fromJsonSafe : function (src) {
        /// <param name="src" type="Order"/>
        this.command = src.command;
        if (gameEngine.hero.guid === src.source.guid) {
            this.source = gameEngine.hero;
        }
        else {
            // TODO : handle this properly - client is propably out of sync or cheating  --> kick it out of the game
            throw "Tech Error - Guid does not match - " + src.source.guid + " - " + gameEngine.hero.guid;
        }
        this.target = gameEngine.level.tiles[src.target.y][src.target.x];
    }
};

