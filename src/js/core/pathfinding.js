/**
 * @file Pathfinding class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * 
 *
 * @class
 */
murmures.Pathfinding = function () {
    /** @type {boolean} */
    this.found = false;
    /** @type {number} */
    this.length = 0;
    /** @type {Array.<murmures.Tile>} */
    this.path = [];
    
    this.pathfindingTiles = [];    
    // content of openSet:
    // { fscore : ['', 'all tile coordinates with this fScore', '', 'x:y', '']
    this.openSet = {};
    this.openSetCount = 0;
};

murmures.Pathfinding.prototype = {
    /**
     * Compute path, using the A* algorithm.
     * Heuristic is octile distance, which should never overestimate the cost
     *
     * @param {murmures.Tile} source - The starting tile.
     * @param {murmures.Tile} target - The targeted tile.
     * @static
     */
    compute: function (source, target, plane) {
        // This function declares local variable with 'var' keyword for performance reason
        // In V8, declarations with 'let' causes a bailout
        // See bug #5666 :
        // https://bugs.chromium.org/p/v8/issues/detail?id=5666
        //murmures.serverLog("starting A*");
        
        var level = gameEngine.level;
        
        this.path = [];
        this.pathfindingTiles = [];
        for (var y = 0; y < level.height; y++) {
            this.pathfindingTiles[y] = [];
            for (var x = 0; x < level.width; x++) {
                this.pathfindingTiles[y][x] = { x: x, y: y, fScore: Infinity, gScore : Infinity, cameFrom: {}, visited: false };
            }
        }      
        var currentFscore = 0;
        this.openSet[0] = [];
        this.openSet[0].push('' + source.x + ':' + source.y);
        this.pathfindingTiles[source.y][source.x].cameFrom = undefined;
        this.pathfindingTiles[source.y][source.x].gScore = 0;
        //this.pathfindingTiles[source.y][source.x].fScore = this.heuristic_cost_estimate(source, target);
        this.openSetCount++;
        while (this.openSetCount > 0) {
            //console.log(JSON.stringify({ openset: this.openSet }));
            while (!(currentFscore in this.openSet)) {
                currentFscore++;
                if (currentFscore > 100000) this.throwUnexpected("currentFscore is too high");
            }
            var currentTile = this.openSet[currentFscore].pop();
            var currentTileX = parseInt(currentTile.split(':')[0], 10);
            var currentTileY = parseInt(currentTile.split(':')[1], 10);
            if (this.openSet[currentFscore].length === 0) delete this.openSet[currentFscore];
            this.openSetCount--;
            if (currentTileX === target.x && currentTileY === target.y) {
                this.reconstruct_path({ x: target.x, y: target.y });
                //murmures.serverLog("ending A*");
                return "success";
            }
            this.pathfindingTiles[currentTileY][currentTileX].visited = true;
            var neighbors = this.getNeighbors(currentTileX, currentTileY);
            neighbors.forEach(function (neighbor) {
                if (this.pathfindingTiles[neighbor.y][neighbor.x].visited) {
                    // ignore
                } else if (level.tiles[neighbor.y][neighbor.x].isPlaneBlocker(plane)) {
                    // ignore too
                } else {
                    var tentative_gScore = this.pathfindingTiles[currentTileY][currentTileX].gScore + neighbor.cost;
                    if (tentative_gScore >= this.pathfindingTiles[neighbor.y][neighbor.x].gScore) {
                    } else {
                        this.pathfindingTiles[neighbor.y][neighbor.x].cameFrom = { x: currentTileX, y: currentTileY, cost: neighbor.cost };
                        this.pathfindingTiles[neighbor.y][neighbor.x].gScore = tentative_gScore;
                        var newFscore = tentative_gScore + this.heuristic_cost_estimate(neighbor, target);
                        this.pathfindingTiles[neighbor.y][neighbor.x].fScore = newFscore;
                        if (!(newFscore in this.openSet)) this.openSet[newFscore] = [];
                        if (!(('' + neighbor.x + ':' + neighbor.y) in this.openSet[newFscore])) this.openSet[newFscore].push('' + neighbor.x + ':' + neighbor.y);
                        this.openSetCount++;
                    }
                }
            }, this);
        }
        //murmures.serverLog("ending A*");
        return "failure";
    },
    
    reconstruct_path: function (current) {
        this.path = [];
        this.path.push(current);
        while (typeof this.pathfindingTiles[current.y][current.x].cameFrom !== 'undefined') {
            current = this.pathfindingTiles[current.y][current.x].cameFrom;
            this.path.push(current);
        }
        //console.log(JSON.stringify({ total_path: this.path }));
    },
    
    heuristic_cost_estimate: function (t1, t2) {
        const deltaX = Math.abs(t1.x - t2.x);
        const deltaY = Math.abs(t1.y - t2.y);
        //let minCoord = (deltaX < deltaY) ? deltaX : deltaY;
        const maxCoord = (deltaX < deltaY) ? deltaY : deltaX;
        //return minCoord * 3 + (maxCoord - minCoord) * 2;
        //return (maxCoord + minCoord) * 2 - minCoord;
        //return (maxCoord + minCoord) + maxCoord;
        return (deltaX + deltaY) + maxCoord;
    },
    
    getNeighbors: function (x, y) {
        const level = gameEngine.level;
        const ret = [];
        if (x < level.width - 1 && y > 0) ret.push({ x: x + 1, y: y - 1, cost: 3 });
        if (x > 0 && y > 0) ret.push({ x: x - 1, y: y - 1, cost: 3 });
        if (x > 0 && y < level.height - 1) ret.push({ x: x - 1, y: y + 1, cost: 3 });
        if (x < level.width - 1 && y < level.height - 1) ret.push({ x: x + 1, y: y + 1, cost: 3 });
        if (x < level.width - 1) ret.push({ x: x + 1, y: y, cost: 2 });
        if (y > 0) ret.push({ x: x, y: y - 1, cost: 2 });
        if (x > 0) ret.push({ x: x - 1, y: y, cost: 2 });
        if (y < level.height - 1) ret.push({ x: x, y: y + 1, cost: 2 });
        return ret;
    },
    
    throwUnexpected: function (txt) {
        console.log(JSON.stringify({ openSet: this.openSet, openSetCount: this.openSetCount, closedSet: this.closedSet }));
        throw txt;
    },
    
    dumpOpenSet: function (openset) {
    },
};
