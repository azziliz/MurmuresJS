'use strict';

gameEngine.classes.OrderManager = function () {
    this.allowOrders = true;
}

gameEngine.classes.OrderManager.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('tileEnter', function (e) {
            let hoveredTile = e.detail;
            let order = new murmures.Order();
            let currentHero = instance.getCurrentHero();
            order.source = currentHero;
            order.target = hoveredTile;
            if (hoveredTile.hasMob.code && !hoveredTile.hasMob.isHero) {
                order.command = 'attack';
            }
            else if (!hoveredTile.hasMob.code) {
                order.command = 'move';
            }
            let check = gameEngine.checkOrder(order);
            if (check.valid) {
                if (order.command === 'move') {
                    window.requestAnimationFrame(function (timestamp) {
                        gameEngine.client.animationManager.queueTrail(order.source.position, order.target, timestamp, timestamp + 200);
                    });
                }
                else if (order.command === 'attack') {
                    window.requestAnimationFrame(function (timestamp) {
                        gameEngine.client.animationManager.queueProjectile(timestamp, order.source.position, order.target);
                    });
                }
            }
            else {
            }
        }, false);
        window.addEventListener('leftClickOnTile', function (e) {
            let hoveredTile = e.detail;
            let currentHero = instance.getCurrentHero();
            //TODO : hasmob return mob or hero same way. It is not considering if a hero is in move or not.
            // In future version, hero must have command move, if the tile contains a hero going on another tile
            // In next version, we have to check the skill... if it is a skll not applying to a hero, it is a move command
            if (hoveredTile.hasMob.code && !hoveredTile.hasMob.isHero) {
                let attackOrder = new murmures.Order();
                attackOrder.command = 'attack';
                attackOrder.source = currentHero;
                attackOrder.target = hoveredTile;
                gameEngine.client.eventManager.emitEvent('launchOrder', attackOrder);
            }
            else {
                let moveOrder = new murmures.Order();
                moveOrder.command = 'move';
                if (hoveredTile.hasMob.code) {
                    if (currentHero.skills[currentHero.activeSkill].targetaudience != murmures.C.TARGET_AUDIENCE_MOB) {
                        moveOrder.command = 'attack';
                    }
                }
                moveOrder.source = currentHero;
                moveOrder.target = hoveredTile;
                gameEngine.client.eventManager.emitEvent('launchOrder', moveOrder);
            }
        }, false);
        window.addEventListener('launchOrder', function (e) {
            let order = e.detail;
            let check = gameEngine.checkOrder(order);
            if (instance.allowOrders) {
                if (check.valid) {
                    document.getElementById('hero' + order.source.guid + '-box').dataset.order = JSON.stringify(order);
                    gameEngine.client.uiManager.log('>> order - ' + order.command);
                    order.clean();
                    gameEngine.client.ws.send(JSON.stringify({ service: 'order', payload: order }));
                    instance.allowOrders = false;
                }
                else {
                    gameEngine.client.uiManager.log('<span style="color:#f66">' + 'ERROR - Invalid order - ' + check.reason + '</span>');
                }
            }
            else {
                gameEngine.client.uiManager.log('<span style="color:#f66">' + 'WARNING - Order was discarded - Waiting for server response </span>');
            }
        }, false);
        window.addEventListener('orderResponseReceivedFromServer', function (e) {
            instance.allowOrders = true;
            let ge = e.detail;
            if (typeof ge === 'undefined') return;
            if (typeof ge.error !== 'undefined') {
                gameEngine.client.uiManager.log('<span style="color:#f66">' + 'ERROR - ' + ge.error + '</span>');
            }
            else {
                let isNewLevel = typeof ge.level !== 'undefined' && typeof ge.level.guid !== 'undefined' && gameEngine.level.guid !== ge.level.guid;
                gameEngine.synchronize(ge);
                //gameEngine.client.ws.send(JSON.stringify({ service: 'consistencyCheck', payload: gameEngine }));
                if (isNewLevel) {
                    gameEngine.client.eventManager.emitEvent('requestRefreshCrawlUi');
                    gameEngine.client.eventManager.emitEvent('requestRenderFullEngine');
                }
                else {
                    gameEngine.client.eventManager.emitEvent('requestRefreshCrawlUi');
                    gameEngine.client.eventManager.emitEvent('requestRenderPartialEngine', ge);
                }
                gameEngine.client.eventManager.emitEvent('requestRenderReportQueue');
            }
        }, false);
    },

    getCurrentHero : function () {
        let heroToReturn = null;
        let itHero = 0;
        while (heroToReturn === null && itHero < gameEngine.heros.length) {
            if (gameEngine.heros[itHero].stateOrder === murmures.C.STATE_HERO_ORDER_INPROGRESS) {
                heroToReturn = gameEngine.heros[itHero];
            }
            itHero++;
        }
        return heroToReturn;
    },
};
