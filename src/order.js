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
        murmures.order = order;
    }
    
    order.prototype.fromJson = function (src) {
        /// <param name="src" type="order"/>
        this.command = src.command;
        this.source = src.source;
        this.target = new murmures.tile();
        this.target.fromJson(src.target);
    };

})(this);