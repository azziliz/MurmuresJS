'use strict';

(function (client) {
    
    var order = function () {
        /// <field name="command" type="String"/>
        /// <field name="source" type="character"/>
        /// <field name="target" type="tile"/>
    };
    
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = order;
    }
    else {
        client.order = order;
    }
    
    order.prototype.fromJson = function (src) {
        /// <param name="src" type="order"/>
        this.command = src.command;
        this.source = src.source;
        this.target = src.target;
    };

})(this);