'use strict';


window.onload = function () {
    gameEngine.client.eventManager.registerPermanentEvents();
    gameEngine.client.renderer.init();

    gameEngine.client.eventManager.emitEmpytEvent('requestTileset');
};