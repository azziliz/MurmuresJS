'use strict';

module.exports = {
    loopTenMillions : function () {
        var modulePerfx = 0;
        for (var loop = 0; loop < 1e8; loop++) {
            modulePerfx = this.addOne(modulePerfx);
        }
        return modulePerfx;
    },
    
    addOne : function (i) {
        return i + 1;
    }
};