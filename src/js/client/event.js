'use strict';

gameEngine.classes.EventManager = function () {    
    this.eventsRegistered = false;
}

gameEngine.classes.EventManager.prototype = {
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
        };
        
        this.onXhrError = function (e) {
            gameEngine.client.uiManager.log('<span style="color:#f66">' + 'ERROR - Vous avez été déconnecté du serveur</span>', 'general');
        }
        
        // IE11 returns decimal number for MouseEvent coordinates but Chrome43 always rounds down.
        // --> using floor() for consistency.
        // and retrieves the nearest pixel coordinates.    
        
        let topLayer = document.getElementById('topLayer');
        if (topLayer !== null) {
        }
        
        this.eventsRegistered = true;
    }
};
