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

    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.client.eventManager.emitEvent('requestCrawlUi');
        //clearUI();
        //initUI();
        //resetCanvas();
        //drawTiles(gameEngine);
        //registerEvents();
    }, false);
    gameEngine.client.eventManager.emitEvent('requestTileset');
};