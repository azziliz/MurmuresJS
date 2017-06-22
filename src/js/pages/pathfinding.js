'use strict';

window.onload = function () {
    gameEngine.client.pathtest = {
        plane : {
            allowFlying: false,
            allowTerrestrial: false,
            allowAquatic: false,
            allowUnderground: false,
            allowEthereal: false,
        },
    };
    
    gameEngine.client.uiManager.init();
    gameEngine.client.eventManager.emitEvent('requestDevTools');
    gameEngine.client.eventManager.init();
    gameEngine.client.renderer.init();
    gameEngine.client.renderer.renderHeroes = false;
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
        document.getElementById('leftCharacters').innerHTML = 
        '<div>Pathfinding plane<br><br><br><div style="display: table;"> <p><label>allowFlying</label><input type="checkbox" id="allowFlying"></p> <p><label>allowTerrestrial</label><input type="checkbox" checked="checked" id="allowTerrestrial"></p> <p><label>allowAquatic</label><input type="checkbox" id="allowAquatic"></p> <p><label>allowUnderground</label><input type="checkbox" id="allowUnderground"></p> <p><label>allowEthereal</label><input type="checkbox" id="allowEthereal"></p> </div></div>';
        document.getElementById('allowFlying').addEventListener('change', function () { gameEngine.client.eventManager.emitEvent('planechange'); });
        document.getElementById('allowTerrestrial').addEventListener('change', function () { gameEngine.client.eventManager.emitEvent('planechange'); });
        document.getElementById('allowAquatic').addEventListener('change', function () { gameEngine.client.eventManager.emitEvent('planechange'); });
        document.getElementById('allowUnderground').addEventListener('change', function () { gameEngine.client.eventManager.emitEvent('planechange'); });
        document.getElementById('allowEthereal').addEventListener('change', function () { gameEngine.client.eventManager.emitEvent('planechange'); });
        gameEngine.client.eventManager.emitEvent('requestRenderFullEngine');
        gameEngine.client.eventManager.emitEvent('planechange');
    }, false);
    window.addEventListener('tileEnter', function (e) {
        let hoveredTile = e.detail;
        let myPath = new murmures.Pathfinding();
        console.log(myPath.compute(gameEngine.level.getEntrance() , hoveredTile, gameEngine.client.pathtest.plane));
        window.requestAnimationFrame(function (timestamp) {
            gameEngine.client.animationManager.animationQueue = [];
            if (myPath.path.length === 0) document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
            for (let i = 0; i < myPath.path.length - 1; i++) {
                gameEngine.client.animationManager.queueTrail(myPath.path[i + 1], myPath.path[i], timestamp, timestamp + 10000);
            }
        });
    }, false);
    window.addEventListener('planechange', function (e) {
        gameEngine.client.pathtest.plane = {
            allowFlying: document.getElementById('allowFlying').checked,
            allowTerrestrial: document.getElementById('allowTerrestrial').checked,
            allowAquatic: document.getElementById('allowAquatic').checked,
            allowUnderground: document.getElementById('allowUnderground').checked,
            allowEthereal: document.getElementById('allowEthereal').checked,
        };
        let myPath = new murmures.Pathfinding();
        console.log(myPath.compute(gameEngine.level.getEntrance() , gameEngine.level.getExit(), gameEngine.client.pathtest.plane));
        window.requestAnimationFrame(function (timestamp) {
            gameEngine.client.animationManager.animationQueue = [];
            if (myPath.path.length === 0) document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
            for (let i = 0; i < myPath.path.length - 1; i++) {
                gameEngine.client.animationManager.queueTrail(myPath.path[i + 1], myPath.path[i], timestamp, timestamp + 10000);
            }
        });
    }, false);
    
    gameEngine.client.eventManager.emitEvent('requestTileset');
};