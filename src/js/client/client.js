'use strict';

gameEngine.client = {
    ws : new WebSocket(location.origin.replace(/^http/, 'ws')),
    renderer : new gameEngine.classes.Renderer(),
    eventManager : new gameEngine.classes.EventManager(),
    uiManager : new gameEngine.classes.UiManager(),
    animationManager : new gameEngine.classes.AnimationManager(),
    orderManager : new gameEngine.classes.OrderManager(),
    inputManager : new gameEngine.classes.InputManager(),
};