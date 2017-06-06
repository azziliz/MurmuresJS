'use strict';

gameEngine.classes.UiManager = function () {
    this.template = {};
}

gameEngine.classes.UiManager.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('requestTileset', function (e) {
            if (!instance.hasProgressBar()) {
                instance.drawProgressBar();
            }
        }, false);
        window.addEventListener('grayscaleTilesetReady', function (e) {
            gameEngine.client.eventManager.emitEmpytEvent('tilesetReady');
        }, false);
    },
    
    hasProgressBar : function () {
        return document.getElementById('tilesetLoadBg') !== null;
    },
    
    drawProgressBar : function () {
    },
};
