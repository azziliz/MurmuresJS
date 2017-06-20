'use strict';

window.onload = function () {
    gameEngine.client.ws.addEventListener('open', function () {
        gameEngine.client.ws.send(JSON.stringify({ service: 'registerServerLog' }));
    });
    window.addEventListener('logReceivedFromServer', function (e) {
        console.log(e.detail);
    }, false);
};