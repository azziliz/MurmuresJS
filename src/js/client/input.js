'use strict';

gameEngine.classes.InputManager = function () {
    this.mouseMoveTarget = { x: -1 | 0, y: -1 | 0 };
    this.mouseIsDown = false;
}

gameEngine.classes.InputManager.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('mainWindowReady', function (e) {
            // IE11 returns decimal number for MouseEvent coordinates but Chrome43 always rounds down.
            // --> using floor() for consistency.
            // and retrieves the nearest pixel coordinates.
            let topLayer = document.getElementById('topLayer');
            topLayer.addEventListener('mousedown', function (e) {
                e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
                instance.mouseIsDown = true;
                let hoveredTile = instance.getHoveredTile(e.offsetX, e.offsetY);
                if (e.button !== 2) {
                    // event is a left click
                    gameEngine.client.eventManager.emitEvent('leftClickOnTile', hoveredTile);
                }
                else {
                    // event is a right click
                    gameEngine.client.eventManager.emitEvent('rightClickOnTile', hoveredTile);
                }
            }, false);
            topLayer.addEventListener('mouseup', function (e) {
                e.preventDefault(); 
                instance.mouseIsDown = false;
            }, false);
            topLayer.addEventListener('mousemove', function (e) {
                e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
                let hoveredTile = instance.getHoveredTile(e.offsetX, e.offsetY);
                if (instance.mouseMoveTarget.x !== hoveredTile.x || instance.mouseMoveTarget.y !== hoveredTile.y) {
                    gameEngine.client.eventManager.emitEvent('tileLeave', instance.mouseMoveTarget);
                    gameEngine.client.eventManager.emitEvent('tileEnter', hoveredTile);
                    instance.mouseMoveTarget.x = hoveredTile.x;
                    instance.mouseMoveTarget.y = hoveredTile.y;
                    if (instance.mouseIsDown) {
                        if (e.button !== 2) {
                            // event is a left click
                            gameEngine.client.eventManager.emitEvent('leftClickOnTile', hoveredTile);
                        }
                        else {
                            // event is a right click
                            gameEngine.client.eventManager.emitEvent('rightClickOnTile', hoveredTile);
                        }
                    }
                }
            }, false);
        }, false);
    },
    
    getHoveredTile : function (mouseEventX, mouseEventY) {
        let tileX = Math.floor(mouseEventX / gameEngine.tileSize);
        if (tileX < 0) tileX = 0;
        if (tileX >= gameEngine.level.width) tileX = gameEngine.level.width - 1;
        let tileY = Math.floor(mouseEventY / gameEngine.tileSize);
        if (tileY < 0) tileY = 0;
        if (tileY >= gameEngine.level.height) tileY = gameEngine.level.height - 1;
        return gameEngine.level.tiles[tileY][tileX];
    },
        
};
