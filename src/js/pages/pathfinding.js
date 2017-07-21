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
    
    gameEngine.client.uiBuilder.init();
    gameEngine.client.eventDispatcher.emitEvent('requestDevTools');
    gameEngine.client.eventDispatcher.init();
    gameEngine.client.renderer.init();
    gameEngine.client.renderer.renderHeroes = false;
    gameEngine.client.animationScheduler.init();
    gameEngine.client.inputHandler.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        for (let x = 0; x < gameEngine.level.width; x++) {
            for (let y = 0; y < gameEngine.level.height; y++) {
                gameEngine.level.tiles[y][x].state = murmures.C.TILE_FOG_OF_WAR;
            }
        }
        gameEngine.client.eventDispatcher.emitEvent('requestCrawlUi');
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        document.getElementById('leftCharacters').innerHTML = 
        '<div>Pathfinding plane<br><br><br><div style="display: table;"> <p><label>allowFlying</label><input type="checkbox" id="allowFlying"></p> <p><label>allowTerrestrial</label><input type="checkbox" checked="checked" id="allowTerrestrial"></p> <p><label>allowAquatic</label><input type="checkbox" id="allowAquatic"></p> <p><label>allowUnderground</label><input type="checkbox" id="allowUnderground"></p> <p><label>allowEthereal</label><input type="checkbox" id="allowEthereal"></p> </div></div>';
        document.getElementById('allowFlying').addEventListener('change', function () { gameEngine.client.eventDispatcher.emitEvent('planechange'); });
        document.getElementById('allowTerrestrial').addEventListener('change', function () { gameEngine.client.eventDispatcher.emitEvent('planechange'); });
        document.getElementById('allowAquatic').addEventListener('change', function () { gameEngine.client.eventDispatcher.emitEvent('planechange'); });
        document.getElementById('allowUnderground').addEventListener('change', function () { gameEngine.client.eventDispatcher.emitEvent('planechange'); });
        document.getElementById('allowEthereal').addEventListener('change', function () { gameEngine.client.eventDispatcher.emitEvent('planechange'); });
        gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
        gameEngine.client.eventDispatcher.emitEvent('planechange');
    }, false);
    window.addEventListener('tileEnter', function (e) {
        const hoveredTile = e.detail;
        const myPath = new murmures.Pathfinding();
        myPath.compute(gameEngine.level.getEntrance() , hoveredTile, gameEngine.client.pathtest.plane);
        //murmures.serverLog('start castRay * 1e5');
        //for (let i = 0; i < 1e5; i++) {
        //    const myRay = gameEngine.level.castRay(gameEngine.level.getEntrance() , hoveredTile);
        //}
        //murmures.serverLog('end castRay');
        const myLos = gameEngine.level.castRay(gameEngine.level.getEntrance() , hoveredTile);
        window.requestAnimationFrame(function (timestamp) {
            gameEngine.client.animationScheduler.animationQueue = [];
            if (myPath.path.length === 0) document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
            for (let i = 0; i < myPath.path.length - 1; i++) {
                gameEngine.client.animationScheduler.queueTrail(myPath.path[i + 1], myPath.path[i], timestamp, timestamp + 10000);
            }
            for (let x = 0; x < gameEngine.level.width; x++) {
                for (let y = 0; y < gameEngine.level.height; y++) {
                    gameEngine.level.tiles[y][x].state = murmures.C.TILE_FOG_OF_WAR;
                }
            }
            if (typeof myLos !== 'undefined' && myLos.length > 0) {
                for (let i = 0; i < myLos.length; i++) {
                    gameEngine.level.tiles[myLos[i].y][myLos[i].x].state = murmures.C.TILE_HIGHLIGHTED;
                }
            }
            gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
            const context = document.getElementById('characterLayer').getContext('2d');
            context.beginPath();
            context.moveTo(gameEngine.tileSize * (hoveredTile.x + 0.5), gameEngine.tileSize * (hoveredTile.y + 0.5));
            context.lineTo(gameEngine.tileSize * (gameEngine.level.getEntrance().x + 0.5), gameEngine.tileSize * (gameEngine.level.getEntrance().y + 0.5));
            context.strokeStyle = '#f00';
            context.stroke();
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
        const myPath = new murmures.Pathfinding();
        myPath.compute(gameEngine.level.getEntrance() , gameEngine.level.getExit(), gameEngine.client.pathtest.plane);
        window.requestAnimationFrame(function (timestamp) {
            gameEngine.client.animationScheduler.animationQueue = [];
            if (myPath.path.length === 0) document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
            for (let i = 0; i < myPath.path.length - 1; i++) {
                gameEngine.client.animationScheduler.queueTrail(myPath.path[i + 1], myPath.path[i], timestamp, timestamp + 10000);
            }
        });
    }, false);
    
    gameEngine.client.eventDispatcher.emitEvent('requestTileset');
};