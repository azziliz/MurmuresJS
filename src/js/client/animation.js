'use strict';

gameEngine.classes.AnimationManager = function () {
    this.animationQueue = [];
}

gameEngine.classes.AnimationManager.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('heroAnimationEnded', function (e) {
            instance.onHeroAnimationEnded(e.detail);
        }, false);
        window.addEventListener('requestRenderReportQueue', function (e) {
            instance.renderReportQueue();
        }, false);
        this.animationTick(0);
    },
    
    animationTick : function (timestamp) {
        let instance = this;
        if (this.animationQueue.length > 0) {
            let newAnimationQueue = [];
            document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
            this.animationQueue.forEach(function (projectile) {
                if (timestamp <= projectile.end) {
                    if (timestamp >= projectile.start) this.drawAnimation(projectile.start, projectile.end, timestamp, projectile.imgX, projectile.imgY, projectile.sourceTile, projectile.destTile);
                    newAnimationQueue.push(projectile);
                }
                else {
                    if (typeof projectile.endEvent !== 'undefined') {
                        gameEngine.client.eventManager.emitEvent(projectile.endEvent);
                    }
                }
            }, this);
            this.animationQueue = newAnimationQueue;
        }
        window.requestAnimationFrame(function (timestamp) {
            instance.animationTick(timestamp);
        });
    },
    
    onHeroAnimationEnded : function () {
        if (gameEngine.reportQueue.length === 0) return;
        let aiProjectileMoves = gameEngine.reportQueue.filter(function (report) { return report.priority === 120 });
        if (aiProjectileMoves.length > 0) {
            let instance = this;
            aiProjectileMoves.forEach(function (report) {
                window.requestAnimationFrame(function (timestamp) {
                    instance.queueProjectile(timestamp + 100, report.sourceTile, report.targetTile);
                });
            }, this);
            gameEngine.reportQueue = gameEngine.reportQueue.filter(function (report) { return report.priority !== 120 });
        }
    },
    
    renderReportQueue : function () {
        if (gameEngine.reportQueue.length === 0) return;
        let instance = this;
        gameEngine.heros.forEach(function (hero) {
            document.getElementById('hero' + hero.guid + '-box').dataset.order = '';
        }, this);
        let heroMoves = gameEngine.reportQueue.filter(function (report) { return report.priority === 10 });
        if (heroMoves.length > 0) {
            heroMoves.forEach(function (report) {
                window.requestAnimationFrame(function (timestamp) {
                    instance.queueTrail(report.sourceTile, report.targetTile, timestamp);
                });
            }, this);
            gameEngine.reportQueue = gameEngine.reportQueue.filter(function (report) { return report.priority !== 10 });
        }
        let heroProjectileMoves = gameEngine.reportQueue.filter(function (report) { return report.priority === 20 });
        if (heroProjectileMoves.length > 0) {
            heroProjectileMoves.forEach(function (report) {
                window.requestAnimationFrame(function (timestamp) {
                    instance.queueProjectile(timestamp, report.sourceTile, report.targetTile, 'heroAnimationEnded');
                });
            }, this);
            gameEngine.reportQueue = gameEngine.reportQueue.filter(function (report) { return report.priority !== 20 });
        }
        else {
            gameEngine.client.eventManager.emitEvent('heroAnimationEnded');
        }
    },
    
    computeTrail : function (sourceTile, destTile) {
        let direction = -1;
        if (destTile.x === sourceTile.x && destTile.y === sourceTile.y - 1) direction = 0;
        else if (destTile.x === sourceTile.x + 1 && destTile.y === sourceTile.y - 1) direction = 1;
        else if (destTile.x === sourceTile.x + 1 && destTile.y === sourceTile.y) direction = 2;
        else if (destTile.x === sourceTile.x + 1 && destTile.y === sourceTile.y + 1) direction = 3;
        else if (destTile.x === sourceTile.x && destTile.y === sourceTile.y + 1) direction = 4;
        else if (destTile.x === sourceTile.x - 1 && destTile.y === sourceTile.y + 1) direction = 5;
        else if (destTile.x === sourceTile.x - 1 && destTile.y === sourceTile.y) direction = 6;
        else if (destTile.x === sourceTile.x - 1 && destTile.y === sourceTile.y - 1) direction = 7;
        if (direction === -1) return; // this happens when the player moves the mouse very fast -> source and dest are more than 1 tile appart
        let sourceBody = '_b1_91_travel_path_to' + (1 + direction).toString();
        let destBody = '_b1_91_travel_path_from' + (1 + ((direction + 4) % 8)).toString();
        let sourceRank = gameEngine.bodies[sourceBody].rank;
        let destRank = gameEngine.bodies[destBody].rank;
        let sourceX = sourceRank % 64;
        let sourceY = (sourceRank - sourceX) / 64;
        let destX = destRank % 64;
        let destY = (destRank - destX) / 64;
        return {
            sourceX: sourceX,
            sourceY: sourceY,
            destX: destX,
            destY: destY
        }
    },
    
    queueTrail : function (sourceTile, destTile, start, end) {
        let ret = this.computeTrail(sourceTile, destTile);
        if (typeof ret === 'undefined') return;
        this.animationQueue.push({
            start: start,
            end: (typeof end !== 'undefined') ? end : (start + 1500),
            imgX: ret.sourceX,
            imgY: ret.sourceY,
            sourceTile: sourceTile,
            destTile: sourceTile
        });
        this.animationQueue.push({
            start: start,
            end: (typeof end !== 'undefined') ? end : (start + 1500),
            imgX: ret.destX,
            imgY: ret.destY,
            sourceTile: destTile,
            destTile: destTile
        });
    },
    
    queueProjectile : function (start, sourceTile, destTile, endEvent) {
        let direction = -1;
        let deltaX = destTile.x - sourceTile.x;
        let absDeltaX = Math.abs(deltaX);
        let deltaY = destTile.y - sourceTile.y;
        let absDeltaY = Math.abs(deltaY);
        // Note: 2.414 === 1 / Math.tan(45°/2) ; this is the bisecting angle between 2 directions
        if (deltaY < 0 && 2.414 * absDeltaX < absDeltaY) direction = 0;
        else if (deltaX > 0 && 2.414 * absDeltaY < absDeltaX) direction = 2;
        else if (deltaY > 0 && 2.414 * absDeltaX < absDeltaY) direction = 4;
        else if (deltaX < 0 && 2.414 * absDeltaY < absDeltaX) direction = 6;
        else if (deltaY < 0 && deltaX > 0) direction = 1;
        else if (deltaY > 0 && deltaX > 0) direction = 3;
        else if (deltaY > 0 && deltaX < 0) direction = 5;
        else if (deltaY < 0 && deltaX < 0) direction = 7;
        //let imgRank = gameEngine.bodies['_b1_92_flame0'].rank;
        let imgRank = gameEngine.bodies['_b1_92_stone_arrow' + direction].rank;
        //let imgRank = gameEngine.bodies['_b1_92_icicle' + direction].rank;
        let imgX = imgRank % 64;
        let imgY = (imgRank - imgX) / 64;
        this.animationQueue.push({
            start: start,
            end: start + 150 + 100 * Math.max(absDeltaX, absDeltaY),
            imgX: imgX,
            imgY: imgY,
            sourceTile: sourceTile,
            destTile: destTile,
            endEvent: endEvent
        });
    },
    
    drawAnimation : function (start, end, timestamp, imgX, imgY, sourceTile, destTile) {
        let lerpRatio = (timestamp - start) / (end - start);
        let lerpX = sourceTile.x * (1 - lerpRatio) + destTile.x * lerpRatio;
        let lerpY = sourceTile.y * (1 - lerpRatio) + destTile.y * lerpRatio;
        document.getElementById('projectileLayer').getContext('2d').drawImage(gameEngine.client.renderer.tileset.color.imgElement,
                    imgX * gameEngine.tileSize, imgY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * lerpX, gameEngine.tileSize * lerpY, gameEngine.tileSize, gameEngine.tileSize);
    },
};