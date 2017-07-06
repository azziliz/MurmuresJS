'use strict';

murmures.OrderHandler = function () {
    this.allowOrders = true;
}

murmures.OrderHandler.prototype = {
    init : function () {
        const instance = this;
        window.addEventListener('tileEnter', function (e) {
            const hoveredTile = e.detail;
            const order = new murmures.Order();
            const currentHero = gameEngine.getCurrentHero();
            order.source = currentHero;
            order.target = hoveredTile;
            if (hoveredTile.hasMob.code && !hoveredTile.hasMob.isHero) {
                order.command = 'attack';
            }
            else if (!hoveredTile.hasMob.code) {
                order.command = 'move';
            }
            const check = gameEngine.checkOrder(order);
            if (check.valid) {
                if (order.command === 'move') {
                    window.requestAnimationFrame(function (timestamp) {
                        gameEngine.client.animationScheduler.queueTrail(order.source.position, order.target, timestamp, timestamp + 200);
                    });
                }
                else if (order.command === 'attack') {
                    window.requestAnimationFrame(function (timestamp) {
                        gameEngine.client.animationScheduler.queueProjectile(timestamp, order.source.position, order.target);
                    });
                }
            }
            else {
            }
        }, false);
        window.addEventListener('leftClickOnTile', function (e) {
            const hoveredTile = e.detail;
            const currentHero = gameEngine.getCurrentHero();
            //TODO : hasmob return mob or hero same way. It is not considering if a hero is in move or not.
            // In future version, hero must have command move, if the tile contains a hero going on another tile
            // In next version, we have to check the skill... if it is a skll not applying to a hero, it is a move command
            if (hoveredTile.hasMob.code && !hoveredTile.hasMob.isHero) {
                const attackOrder = new murmures.Order();
                attackOrder.command = 'attack';
                attackOrder.source = currentHero;
                attackOrder.target = hoveredTile;
                gameEngine.client.eventDispatcher.emitEvent('launchOrder', attackOrder);
            }
            else {
                const moveOrder = new murmures.Order();
                moveOrder.command = 'move';
                if (hoveredTile.hasMob.code) {
                    if (currentHero.skills[currentHero.activeSkill].targetaudience !== murmures.C.TARGET_AUDIENCE_MOB) {
                        moveOrder.command = 'attack';
                    }
                }
                moveOrder.source = currentHero;
                moveOrder.target = hoveredTile;
                gameEngine.client.eventDispatcher.emitEvent('launchOrder', moveOrder);
            }
        }, false);
        window.addEventListener('launchOrder', function (e) {
            const order = e.detail;
            const check = gameEngine.checkOrder(order);
            if (instance.allowOrders) {
                if (check.valid) {
                    document.getElementById('hero' + order.source.guid + '-box').dataset.order = JSON.stringify(order);
                    gameEngine.client.uiBuilder.log('>> order - ' + order.command);
                    order.clean();
                    gameEngine.client.ws.send(JSON.stringify({ service: 'order', payload: order }));
                    instance.allowOrders = false;
                }
                else {
                    gameEngine.client.uiBuilder.log('<span style="color:#f66">' + 'ERROR - Invalid order - ' + check.reason + '</span>');
                }
            }
            else {
                gameEngine.client.uiBuilder.log('<span style="color:#f66">' + 'WARNING - Order was discarded - Waiting for server response </span>');
            }
        }, false);
        window.addEventListener('orderResponseReceivedFromServer', function (e) {
            instance.allowOrders = true;
            const ge = e.detail;
            if (typeof ge === 'undefined') return;
            if (typeof ge.error !== 'undefined') {
                gameEngine.client.uiBuilder.log('<span style="color:#f66">' + 'ERROR - ' + ge.error + '</span>');
            }
            else {
                const isNewLevel = typeof ge.level !== 'undefined' && typeof ge.level.guid !== 'undefined' && gameEngine.level.guid !== ge.level.guid;
                gameEngine.synchronize(ge);
                //gameEngine.client.ws.send(JSON.stringify({ service: 'consistencyCheck', payload: gameEngine }));
                if (isNewLevel) {
                    gameEngine.client.eventDispatcher.emitEvent('requestRefreshCrawlUi');
                    gameEngine.client.eventDispatcher.emitEvent('requestRenderFullEngine');
                }
                else {
                    gameEngine.client.eventDispatcher.emitEvent('requestRefreshCrawlUi');
                    gameEngine.client.eventDispatcher.emitEvent('requestRenderPartialEngine', ge);
                }
                gameEngine.client.eventDispatcher.emitEvent('requestRenderReportQueue');
            }
        }, false);
    },
};
