'use strict';

gameEngine.classes.InputManager = function () {
    this.mouseMoveTarget = { x: -1 | 0, y: -1 | 0 };
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
                let targetedTile = instance.getHoveredTile(e.offsetX, e.offsetY);
                instance.topLayer_onClick(targetedTile, e.button === 2);
            }, false);
            topLayer.addEventListener('mousemove', function (e) {
                e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
                let targetedTile = instance.getHoveredTile(e.offsetX, e.offsetY);
                instance.topLayer_onMouseMove(targetedTile, e.button === 2);
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
    
    topLayer_onMouseMove : function (hoveredTile, rightClick) {
        if (this.mouseMoveTarget.x !== hoveredTile.x || this.mouseMoveTarget.y !== hoveredTile.y) {
            gameEngine.client.eventManager.emitEvent('newHoveredTile', hoveredTile);
            //let order = new murmures.Order();
            //let currentHero = getCurrentHero();
            //order.source = currentHero;
            //order.target = hoveredTile;
            //if (hoveredTile.hasMob.code) {
            //    order.command = 'attack';
            //}
            //else {
            //    order.command = 'move';
            //}
            //let check = gameEngine.checkOrder(order);
            //if (check.valid) {
            //    if (order.command === 'move') {
            //        window.requestAnimationFrame(function (timestamp) {
            //        //queueTrail(timestamp, order.source.position, order.target);
            //        });
            //    }
            //    else if (order.command === 'attack') {
            //        window.requestAnimationFrame(function (timestamp) {
            //        //queueProjectile(timestamp, order.source.position, order.target);
            //        });
            //    }
            //}
            //else {
            //}
            this.mouseMoveTarget.x = hoveredTile.x;
            this.mouseMoveTarget.y = hoveredTile.y;
        }
    },
    
    topLayer_onClick : function (hoveredTile, rightClick) {
        if (!rightClick) {
            // event is a left click
            gameEngine.client.eventManager.emitEvent('leftClickOnTile', hoveredTile);
        }
        else {
        // event is a right click
            gameEngine.client.eventManager.emitEvent('rightClickOnTile', hoveredTile);
        }
    },
    
};
