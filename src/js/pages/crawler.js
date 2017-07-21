'use strict';

window.onload = function () {    
    let debug = true;    
    gameEngine.client.uiBuilder.init();
    if (debug) {
        gameEngine.client.eventDispatcher.emitEvent('requestDevTools');
        // logs
        //window.addEventListener('requestTileset', function (e) {
        //    gameEngine.client.uiBuilder.log('requestTileset', 'general');
        //}, false);
        //window.addEventListener('colorTilesetReady', function (e) {
        //    gameEngine.client.uiBuilder.log('colorTilesetReady', 'general');
        //}, false);
        //window.addEventListener('grayscaleTilesetReady', function (e) {
        //    gameEngine.client.uiBuilder.log('grayscaleTilesetReady', 'general');
        //}, false);
    };
    
    gameEngine.client.eventDispatcher.init();
    gameEngine.client.renderer.init();
    gameEngine.client.animationScheduler.init();
    gameEngine.client.orderHandler.init();
    gameEngine.client.inputHandler.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.client.eventDispatcher.emitEvent('requestCrawlUi');
        gameEngine.client.eventDispatcher.emitEvent('requestTimeline');
    }, false);
    window.addEventListener('orderResponseReceivedFromServer', function (e) {
        if (gameEngine.state === murmures.C.STATE_ENGINE_DEATH) {
            gameEngine.client.uiBuilder.log('YOU DIE !');
        }
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        gameEngine.client.eventDispatcher.emitEvent('requestRefreshCrawlUi');
        gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
    }, false);
    gameEngine.client.eventDispatcher.emitEvent('requestTileset');
};