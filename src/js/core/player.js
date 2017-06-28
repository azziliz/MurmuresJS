/**
 * @file Player class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;


murmures.Player = function () {
};

murmures.Player.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Player"/>
        this.id = src.id;
        this.name = src.name;
        this.character = src.character;
        this.level = src.level;
    }
};

