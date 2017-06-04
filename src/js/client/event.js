'use strict';

function registerPermanentEvents() {
    if (gameEngine.client.eventsRegistered) return; // We want to resister events only once

    // IE11 returns decimal number for MouseEvent coordinates but Chrome43 always rounds down.
    // --> using floor() for consistency.
    // and retrieves the nearest pixel coordinates.    

    let topLayer = document.getElementById('topLayer');
    if (topLayer !== null) {
    }


}