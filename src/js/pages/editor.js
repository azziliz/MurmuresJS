'use strict';


window.onload = function () {
    
    gameEngine.client.uiManager.init();
    gameEngine.client.eventManager.emitEvent('requestDevTools');    
    gameEngine.client.eventManager.init();
    gameEngine.client.renderer.init();
    gameEngine.client.inputManager.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.client.eventManager.emitEvent('requestHighlight');
        gameEngine.client.eventManager.emitEvent('requestEditorUi');
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        gameEngine.client.eventManager.emitEvent('initializeCrawl');
    }, false);
    gameEngine.client.eventManager.emitEvent('requestTileset');
};