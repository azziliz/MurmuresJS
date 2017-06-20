'use strict';
//debugger;

/**
 * @file Pathfinding class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * 
 *
 * @class
 */
murmures.Pathfinding = function () {
    /** @type {boolean} */
    this.found = false;
    /** @type {number} */
    this.length = 0 | 0;
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
     * Heuristic is Max(x, y), which should never overestimate the cost
     *
     * @param {murmures.Tile} source - The starting tile.
     * @param {murmures.Tile} target - The targeted tile.
     * @static
     */
    compute: function (source, target) {
        murmures.serverLog("starting A*");
        let level = gameEngine.level;
        
        this.pathfindingTiles = [];
        for (let y = 0; y < level.height; y++) {
            this.pathfindingTiles[y] = [];
            for (let x = 0; x < level.width; x++) {
                this.pathfindingTiles[y][x] = { x: x, y: y, fScore: Infinity, gScore : Infinity, cameFrom: {}, visited: false };
            }
        }        
        let currentFscore = 0;
        this.openSet[0] = [];
        this.openSet[0].push('' + source.x + ':' + source.y);
        delete this.pathfindingTiles[source.y][source.x].cameFrom;
        this.pathfindingTiles[source.y][source.x].gScore = 0;
        //this.pathfindingTiles[source.y][source.x].fScore = this.heuristic_cost_estimate(source, target);
        this.openSetCount++;
        while (this.openSetCount > 0) {
            //console.log(JSON.stringify({ openset: this.openSet }));
            while (!(currentFscore in this.openSet)) {
                currentFscore++;
                if (currentFscore > 100000) this.throwUnexpected("currentFscore is too high");
            }
            let currentTile = this.openSet[currentFscore].pop();
            let currentTileX = parseInt(currentTile.split(':')[0]);
            let currentTileY = parseInt(currentTile.split(':')[1]);
            if (this.openSet[currentFscore].length === 0) delete this.openSet[currentFscore];
            this.openSetCount--;
            if (currentTileX === target.x && currentTileY === target.y) {
                this.reconstruct_path({ x: target.x, y: target.y });
                murmures.serverLog("ending A*");
                return "success";
            }
            this.pathfindingTiles[currentTileY][currentTileX].visited = true;
            let neighbors = this.getNeighbors(currentTileX, currentTileY);
            neighbors.forEach(function (neighbor) {
                if (this.pathfindingTiles[neighbor.y][neighbor.x].visited) {
                }
                else if (level.tiles[neighbor.y][neighbor.x].isWall()) {
                }
                else {
                    let tentative_gScore = this.pathfindingTiles[currentTileY][currentTileX].gScore + neighbor.cost;
                    if (tentative_gScore >= this.pathfindingTiles[neighbor.y][neighbor.x].gScore) {
                    }
                    else {
                        this.pathfindingTiles[neighbor.y][neighbor.x].cameFrom = { x: currentTileX, y: currentTileY };
                        this.pathfindingTiles[neighbor.y][neighbor.x].gScore = tentative_gScore;
                        let newFscore = tentative_gScore + this.heuristic_cost_estimate(neighbor, target);
                        this.pathfindingTiles[neighbor.y][neighbor.x].fScore = newFscore;
                        if (!(newFscore in this.openSet)) this.openSet[newFscore] = [];
                        if (!(('' + neighbor.x + ':' + neighbor.y) in this.openSet[newFscore])) this.openSet[newFscore].push('' + neighbor.x + ':' + neighbor.y);
                        this.openSetCount++;
                    }
                }
            }, this);
        }
        murmures.serverLog("ending A*");
        return "failure";
    },
    
    reconstruct_path: function (current) {
        let total_path = [];
        total_path.push(current);
        while (typeof this.pathfindingTiles[current.y][current.x].cameFrom !== 'undefined') {
            current = this.pathfindingTiles[current.y][current.x].cameFrom;
            total_path.push(current);
        }
        console.log(JSON.stringify({ total_path: total_path }));
    },
    
    heuristic_cost_estimate: function (t1, t2) {
        let deltaX = Math.abs(t1.x - t2.x);
        let deltaY = Math.abs(t1.y - t2.y);
        let minCoord = (deltaX < deltaY) ? deltaX : deltaY;
        let maxCoord = (deltaX < deltaY) ? deltaY : deltaX;
        return minCoord * 3 + (maxCoord - minCoord) * 2;
    },
    
    getNeighbors: function (x, y) {
        let level = gameEngine.level;
        let ret = [];
        if (x < level.width - 1) ret.push({ x: x + 1, y: y, cost: 2 });
        if (x < level.width - 1 && y > 0) ret.push({ x: x + 1, y: y - 1, cost: 3 });
        if (y > 0) ret.push({ x: x, y: y - 1, cost: 2 });
        if (x > 0 && y > 0) ret.push({ x: x - 1, y: y - 1, cost: 3 });
        if (x > 0) ret.push({ x: x - 1, y: y, cost: 2 });
        if (x > 0 && y < level.height - 1) ret.push({ x: x - 1, y: y + 1, cost: 3 });
        if (y < level.height - 1) ret.push({ x: x, y: y + 1, cost: 2 });
        if (x < level.width - 1 && y < level.height - 1) ret.push({ x: x + 1, y: y + 1, cost: 3 });
        return ret;
    },
    
    throwUnexpected: function (txt) {
        console.log(JSON.stringify({ openSet: this.openSet, openSetCount: this.openSetCount, closedSet: this.closedSet }));
        throw txt;
    },
    
    dumpOpenSet: function (openset) {
    },
};
