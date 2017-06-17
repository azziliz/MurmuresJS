'use strict';

window.onload = function () {
    gameEngine.client.pathtest = {
        origin : { x: 0, y: 0 },
    };

    gameEngine.client.uiManager.init();
    gameEngine.client.eventManager.emitEvent('requestDevTools');
    gameEngine.client.eventManager.init();
    gameEngine.client.renderer.init();
    gameEngine.client.animationManager.init();
    gameEngine.client.inputManager.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.client.eventManager.emitEvent('requestHighlight');
        gameEngine.client.eventManager.emitEvent('requestCrawlUi');
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        gameEngine.client.eventManager.emitEvent('requestRenderFullEngine');
    }, false);
    window.addEventListener('tileEnter', function (e) {
        let hoveredTile = e.detail;
        let myPath = new murmures.Pathfinding();
        myPath.compute(origin, hoveredTile);
    }, false);

    gameEngine.client.eventManager.emitEvent('requestTileset');
};