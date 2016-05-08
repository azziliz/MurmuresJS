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
    }
};

