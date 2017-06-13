'use strict';


window.onload = function () {
    
    let debug = true;
    
    gameEngine.client.uiManager.init();
    if (debug) {
        gameEngine.client.eventManager.emitEvent('requestDevTools');
        // logs
        //window.addEventListener('requestTileset', function (e) {
        //    gameEngine.client.uiManager.log('requestTileset', 'general');
        //}, false);
        //window.addEventListener('colorTilesetReady', function (e) {
        //    gameEngine.client.uiManager.log('colorTilesetReady', 'general');
        //}, false);
        //window.addEventListener('grayscaleTilesetReady', function (e) {
        //    gameEngine.client.uiManager.log('grayscaleTilesetReady', 'general');
        //}, false);
    };
    
    gameEngine.client.eventManager.init();
    gameEngine.client.renderer.init();
    gameEngine.client.animationManager.init();
    gameEngine.client.orderManager.init();
    gameEngine.client.inputManager.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.client.eventManager.emitEvent('requestCrawlUi');
    }, false);
    window.addEventListener('orderResponseReceivedFromServer', function (e) {
        if (gameEngine.state === murmures.C.STATE_ENGINE_DEATH) {
            gameEngine.client.uiManager.log('YOU DIE !');
        }
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        gameEngine.client.eventManager.emitEvent('requestRefreshCrawlUi');
        gameEngine.client.eventManager.emitEvent('requestRenderFullEngine');
        //drawTiles(gameEngine);
        //registerEvents();
    }, false);
    gameEngine.client.eventManager.emitEvent('requestTileset');
};