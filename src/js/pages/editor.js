'use strict';

window.onload = function () {
    gameEngine.client.editor = {
        mouseIsDown : false,
        justDrawn : { x: 0, y: 0 },
        selectedBrush : {
            id: '_b1_01_floor_of_a_room.rl1',
            layerId: '01',
            mode: 'paint'
        },
    };
    
    gameEngine.client.uiBuilder.init();
    gameEngine.client.eventDispatcher.emitEvent('requestDevTools');
    gameEngine.client.eventDispatcher.init();
    gameEngine.client.renderer.init();
    gameEngine.client.renderer.renderHeroes = false;
    gameEngine.client.inputHandler.init();
    
    window.addEventListener('tilesetReady', function (e) {
        gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
    }, false);
    window.addEventListener('engineReceivedFromServer', function (e) {
        gameEngine.initialize(e.detail);
        gameEngine.level.build(e.detail.level); // this is mandatory to instanciate mobs from tiles.charId
        gameEngine.client.eventDispatcher.emitEvent('requestHighlight');
        gameEngine.client.eventDispatcher.emitEvent('requestEditorUi');
    }, false);
    window.addEventListener('mainWindowReady', function (e) {
        gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
    }, false);
    window.addEventListener('editorSave', function (e) {
        let body = {};
        let uniqueId = document.getElementById('uniqueId').value;
        body.layerId = document.getElementById('layerId').value;
        body.rank = parseInt(document.getElementById('rank').value, 10);
        let hasPhysics = document.getElementById('hasPhysics').checked;
        if (hasPhysics) {
            body.hasPhysics = true;
            body.allowFlying = document.getElementById('allowFlying').checked;
            body.allowTerrestrial = document.getElementById('allowTerrestrial').checked;
            body.allowAquatic = document.getElementById('allowAquatic').checked;
            body.allowUnderground = document.getElementById('allowUnderground').checked;
            body.allowEthereal = document.getElementById('allowEthereal').checked;
        }
        body.behavior = JSON.parse(document.getElementById('behavior').value);
        gameEngine.bodies[uniqueId] = body;
    }, false);
    window.addEventListener('leftClickOnTile', function (e) {
        let hoveredTile = e.detail;
        hoveredTile[murmures.C.LAYERS[gameEngine.client.editor.selectedBrush.layerId][1]] = gameEngine.client.editor.selectedBrush.id;
        let newLvl = new murmures.Level();
        newLvl.build(gameEngine.level); // this is mandatory to instanciate mobs from tiles.charId
        gameEngine.level = newLvl;
        gameEngine.client.eventDispatcher.emitEvent('requestHighlight');
        gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
    }, false);
    window.addEventListener('rightClickOnTile', function (e) {
        let hoveredTile = e.detail;
        hoveredTile[murmures.C.LAYERS[gameEngine.client.editor.selectedBrush.layerId][1]] = '';
        let newLvl = new murmures.Level();
        newLvl.build(gameEngine.level); // this is mandatory to instanciate mobs from tiles.charId
        gameEngine.level = newLvl;
        gameEngine.client.eventDispatcher.emitEvent('requestHighlight');
        gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
    }, false);

    gameEngine.client.eventDispatcher.emitEvent('requestTileset');
};