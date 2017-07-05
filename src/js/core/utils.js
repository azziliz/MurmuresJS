/**
 * @file Utils class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * This class is a collection of static utility methods.
 *
 * @class
 */
murmures.Utils = {
    /**
     * Generates a new Guid.
     *
     * @static
     */
    newGuid : function () {
        return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    },
};
