'use strict';

gameEngine.classes.EventManager = function () {
    
    this.eventsRegistered = false;

}

gameEngine.classes.EventManager.prototype = {
      
    registerPermanentEvents : function () {
        if (this.eventsRegistered) return; // We want to resister events only once
        
        gameEngine.client.ws.onmessage = function (event) {
            let message = JSON.parse(event.data);
            if (message.fn === 'init') {
                let ge = message.payload;
                loadEngine(ge);
            }
            else if (message.fn === 'o') {
                let orderResponse = message.payload;
                onOrderResponse(orderResponse);
            }
        };
        
        this.onXhrError = function (e) {
            gameEngine.client.log('<span style="color:#f66">' + 'ERROR - Vous avez été déconnecté du serveur</span>', 'general');
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
