'use strict';

module.exports = {
    loopTenMillions : function () {
        let modulePerfx = 0;
        for (let loop = 0; loop < 10000000; loop++) {
            modulePerfx = this.addOne(modulePerfx);
        }
        return modulePerfx;
    },
    
    addOne : function (i) {
        return i + 1;
    }
};