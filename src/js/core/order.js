'use strict';
//debugger;

/**
 * @file Order class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * An order is a player-generated instruction or event.
 * 
 * It is sent from the client to the server by an asynchronous request.
 * It contains a "command" field, which describes the type of the order, and various parameters.
 * Currently allowed commands are: "move" and "attack".
 * The list of allowed commands is expected to grow in the future.
 * 
 * Orders validity is enforced by a GameEngine method called "checkOrder".
 * Every time an existing command is modified or a new command is created, the checkOrder method should be updated.
 * 
 * The server responds to an order by sending the new gameEngine state, after the command is executed.
 * 
 * @class
 */
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
            murmures.serverLog("Tech Error - Guid does not match - " + src.source.guid + " - " + gameEngine.hero.guid);
            return { valid: false, reason: 'Technical error - Guid does not match - Please refresh the page' };
        }
        this.target = gameEngine.level.tiles[src.target.y][src.target.x];
        return { valid: true };
    },
    
    clean: function () {
        this.source = { guid: this.source.guid };
        this.target = { x: this.target.x, y: this.target.y };
    }
};

