'use strict';
//debugger;

murmures.VmPerf = function () {
};

murmures.VmPerf.prototype = {
    loopTenMillions : function () {
        let x = 0;
        for (let loop = 0; loop < 1e8; loop++) {
            x = this.addOneA(x);
        }
        return x;
    },
    
    addOneA : function (i) {
        return i + 1;
    }
};

murmures.VmPerfStatic = {
    loopTenMillions : function () {
        let y = 0;
        for (let loop = 0; loop < 1e8; loop++) {
            y = this.addOneB(y);
        }
        return y;
    },
    
    addOneB : function (i) {
        return i + 1;
    }
};