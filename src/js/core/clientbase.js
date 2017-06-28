/**
 * @file murmures namespace. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;


// namespace
var murmures = {
    serverLog: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};
