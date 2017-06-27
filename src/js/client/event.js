'use strict';

murmures.EventDispatcher = function () {    
    this.eventsRegistered = false;
}

murmures.EventDispatcher.prototype = {
    emitEvent : function (type, payload) {
        let event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, false, false, payload);
        window.dispatchEvent(event);
    },
    
    init : function () {
        if (this.eventsRegistered) return; // We want to resister events only once
        
        let instance = this;
        gameEngine.client.ws.onmessage = function (event) {
            let message = JSON.parse(event.data);
            if (message.fn === 'init') {
                let ge = message.payload;
                instance.emitEvent('engineReceivedFromServer', ge);
            }
            else if (message.fn === 'o') {
                let orderResponse = message.payload;
                instance.emitEvent('orderResponseReceivedFromServer', orderResponse);
            }
            else if (message.fn === 'log') {
                let log = message.payload;
                instance.emitEvent('logReceivedFromServer', log);
            }
        };
        
        // TODO : move this function to dispatcher prototype ?
        this.onXhrError = function (e) {
            gameEngine.client.uiBuilder.log('<span style="color:#f66">' + 'ERROR - Vous avez été déconnecté du serveur</span>', 'general');
        }
        
        this.eventsRegistered = true;
    },
};
