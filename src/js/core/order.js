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
    /* 
     * This class does NOT have a fromJson method because the server doesn't send orders to the client.
     * Hence no need to rebuild the order object on client side.
     */

    /**
     * Synchronization method called on server side only.
     * Creates a full Order object from a JSON.
     * This function is labelled "Safe" because it doesn't try to rebuild objects directly from the source.
     * Instead, it reads the client data and builds an Order object refering only to other server objects.
     *
     * @param {Object} src - A parsed version of the stringified remote order.
     */
    fromJsonSafe : function (src) {
        this.command = src.command;
        if (parseFloat(gameEngine.hero.guid) === parseFloat(src.source.guid)) {
            this.source = gameEngine.hero;
        }
        else {
            murmures.serverLog("Tech Error - Guid does not match - " + src.source.guid + " - " + gameEngine.hero.guid);
            return { valid: false, reason: 'Technical error - Guid does not match - Please refresh the page' };
        }
        this.target = gameEngine.level.tiles[src.target.y|0][src.target.x|0];
        return { valid: true };
    },
    
    clean: function () {
        this.source = { guid: this.source.guid };
        this.target = { x: this.target.x, y: this.target.y };
    }
};

