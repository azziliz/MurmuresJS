'use strict';

gameEngine.client = {
    ws : new WebSocket(location.origin.replace(/^http/, 'ws')),
    renderer : new gameEngine.classes.Renderer(),
    eventManager : new gameEngine.classes.EventManager(),
    uiManager : new gameEngine.classes.UiManager(),
};