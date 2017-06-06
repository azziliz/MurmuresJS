'use strict';

gameEngine.client = {
    log : function (txt, channel) {
        let now = new Date();
        if (document.getElementById("screenLog") !== null) {
            document.getElementById("screenLog").insertAdjacentHTML('afterbegin',
            '<span class="channel-debug"><span style="color:#ffa">' + now.toLocaleTimeString() + '.' + ('00' + now.getMilliseconds().toString()).substr(-3) + '</span> ' + txt + '<br></span>');
        }
    },    
    ws : new WebSocket(location.origin.replace(/^http/, 'ws')),
    renderer : new gameEngine.classes.Renderer(),
    eventManager : new gameEngine.classes.EventManager(),
    uiManager : new gameEngine.classes.UiManager(),
};

