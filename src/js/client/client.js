'use strict';

gameEngine.client = {
    ws : new WebSocket(location.origin.replace(/^http/, 'ws')),
    renderer : new murmures.Renderer(),
    eventDispatcher : new murmures.EventDispatcher(),
    uiBuilder : new murmures.UiBuilder(),
    animationScheduler : new murmures.AnimationScheduler(),
    orderHandler : new murmures.OrderHandler(),
    inputHandler : new murmures.InputHandler(),
};