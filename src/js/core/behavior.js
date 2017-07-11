/**
 * @file Behavior class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * This class is a collection of static methods that may be called by the [game engine]{@link murmures.GameEngine}
 * when the [tile]{@link murmures.Tile} targeted by an [order]{@link murmures.Order} contains a callback.
 * Because behaviors are called from the [Order.apply]{@link murmures.Order.apply} function,
 * they only execute on the server.
 *
 * Callbacks are defined -on props only- inside assets.json.
 * They are copied into each tile that contains the prop during a [level]{@link murmures.Level} load.
 * To fire the callback, the order's "command" has to match the behavior name defined in assets.json.
 *
 * All behavior methods have 3 arguments: source, target and cb_params.
 * source and target are the order source and order target, respectively.
 * They are filled by the game engine directly from the client order.
 * cb_params is an Object (usually a string, but it may vary from one callback to another)
 * that is defined inside assets.json to be passed to the callback function.
 *
 * @class
 */
murmures.Behavior = {
    /**
     * This should be a default behavior for all "closed doors".
     *
     * @param {murmures.Character} source - The character that gave the order.
     * @param {murmures.Tile} target - The tile targeted by the order.
     * @param {string} cb_params - Expected to be the uniqueId of the matching "open door" prop.
     * @static
     */
    openDoor : function (source, target, cb_params) {
        gameEngine.level.tiles[target.y][target.x].propId = cb_params; // changes the prop on the tile from "closed door" to "open door"
        gameEngine.level.tiles[target.y][target.x].behavior = gameEngine.bodies[cb_params].behavior; // updates the callback accordingly --> we want the new prop to have a different behavior
    },
    
    /**
     * This should be a default behavior for all staircases going down.
     *
     * @param {murmures.Character} source - The character that gave the order.
     * @param {murmures.Tile} target - The tile targeted by the order.
     * @param {string} cb_params - Unused.
     * @static
     */
    jumpToNextLevel: function (source, target, cb_params) {
        if (gameEngine.activeLevel < gameEngine.levelIds.length - 1) {
            gameEngine.activeLevel++;
            gameEngine.level = gameEngine.levels[gameEngine.activeLevel];
            gameEngine.level.moveHeroesToEntrance();
        }
    },
    
    /**
     * This should be a default behavior for all staircases going up.
     *
     * @param {murmures.Character} source - The character that gave the order.
     * @param {murmures.Tile} target - The tile targeted by the order.
     * @param {string} cb_params - Unused.
     * @static
     */
    jumpToPreviousLevel: function (source, target, cb_params) {
        if (gameEngine.activeLevel > 0) {
            gameEngine.activeLevel--;
            gameEngine.level = gameEngine.levels[gameEngine.activeLevel];
            gameEngine.level.moveHeroesToExit();
        }
    },
};
