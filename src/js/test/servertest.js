'use strict';
//debugger;

murmures.ServerTest = function () {
};

murmures.ServerTest.prototype = {
    run : function (requirefunc) {
        murmures.serverLog('----------');
        murmures.serverLog('Server entering test mode');
        let startTime, endTime;
        murmures.serverLog('.');
        
        murmures.serverLog('Loading performance benchmark for VM (instance)');
        let vmPerfX = new murmures.VmPerf();
        vmPerfX.loopTenMillions();
        startTime = murmures.serverLog('Calling test method from inside the class');
        vmPerfX.loopTenMillions();
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        let vmPerfY = 0;
        startTime = murmures.serverLog('Calling test method from outside the class');
        for (let loop = 0; loop < 1e8; loop++) {
            vmPerfY = vmPerfX.addOneA(vmPerfY);
        }
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        murmures.serverLog('.');
        
        murmures.serverLog('Loading performance benchmark for VM (static)');
        let vmStatic = murmures.VmPerfStatic;
        vmStatic.loopTenMillions();
        startTime = murmures.serverLog('Calling test method from inside the class');
        vmStatic.loopTenMillions();
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        let vmStaticY = 0;
        startTime = murmures.serverLog('Calling test method from outside the class');
        for (let loop = 0; loop < 1e8; loop++) {
            vmStaticY = vmStatic.addOneB(vmStaticY);
        }
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        murmures.serverLog('.');
        
        murmures.serverLog('Loading performance benchmark for module');
        let modulePerf = requirefunc('./src/js/test/moduleperf.js');
        modulePerf.loopTenMillions();
        startTime = murmures.serverLog('Calling test method from inside the class');
        modulePerf.loopTenMillions();
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        let modulePerfY = 0;
        startTime = murmures.serverLog('Calling test method from outside the class');
        for (let loop = 0; loop < 1e8; loop++) {
            modulePerfY = modulePerf.addOne(modulePerfY);
        }
        endTime = murmures.serverLog();
        murmures.serverLog('Result = ' + (endTime - startTime).toString());
        murmures.serverLog('.');

        murmures.serverLog('----------');
    }
};

