'use strict';

// namespace
var murmures = {
    serverLog: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};
