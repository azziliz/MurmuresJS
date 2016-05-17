'use strict';
//debugger;

murmures.Behavior = {
    openDoor : function (source, target, param) {
        gameEngine.level.tiles[target.y][target.x].propId = param;
        gameEngine.level.tiles[target.y][target.x].behavior = gameEngine.bodies[param].behavior;
        gameEngine.level.tiles[target.y][target.x].needsClientUpdate = true;
   }
};

