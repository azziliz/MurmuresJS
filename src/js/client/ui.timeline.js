'use strict';

murmures.UiTimelineComponent = function () {
    // #region templates
    this.template = {
        frame : '<div id="uitcFrame" class="uitcFrame"></div>',
        mark : '<div id="uitcMark_{id}" class="uitcMark"></div>',
        markicons : '<div id="uitcMarkIcons_{id}" class="uitcMark"><div id="tl-char-{id}-icon" class="uiIcon"></div><div id="tl-skill-{id}-icon" class="uiIcon skillIcon"></div></div>',
    };
    // #endregion
    this.parent = {};
    this.zoom = 1;
    this.targetZoom = 1;
    this.startTick = 0;
    this.targetStartTick = 0;
    this.stable = false;
}

murmures.UiTimelineComponent.prototype = {
    init : function (parent) {
        this.parent = parent;
        const instance = this;
        window.addEventListener('requestTimelineZoom', function () {

        }, false);
        window.addEventListener('requestTimelineScroll', function () {

        }, false);
        window.addEventListener('requestTimelineClick', function () {

        }, false);
        window.addEventListener('animationTick', function () {

        }, false);
        window.addEventListener('requestRefreshCrawlUi', function () {
            instance.refresh();
        }, false);
        this.drawFrame();
        this.refresh();
    },
    
    refresh : function () {
        if (this.hasFrame()) {
            this.getFrame().innerHTML = '';
        }
        const aq = gameEngine.timeline.activationQueue;
        const endTicks = {};
        Object.keys(aq).forEach(function (guid) {
            const oneEndTick = aq[guid] === null ? gameEngine.timeline.time : aq[guid].endTick;
            if (!(oneEndTick in endTicks)) endTicks[oneEndTick] = [];
            endTicks[oneEndTick].push(guid);
        }, this);
        Object.keys(endTicks).forEach(function (tick) {
            const guidsAtThisTick = endTicks[tick];
            guidsAtThisTick.forEach(function (guid) {
                this.getFrame().appendChild(
                    this.parent.createElementFromTemplate(this.template.markicons.replace(/{id}/g, guid)));
                const oneChar = aq[guid] === null ? gameEngine.getHeroByGuid(guid) : aq[guid].order.source;
                const ref = gameEngine.bodies[oneChar.mobTemplate];
                const tilesetRank = ref.rank;
                const tilesetX = tilesetRank % 64;
                const tilesetY = (tilesetRank - tilesetX) / 64;
                document.getElementById('tl-char-' + guid + '-icon').style.backgroundImage = "url('" + gameEngine.client.renderer.tileset.color.blobUrl + "')";
                document.getElementById('tl-char-' + guid + '-icon').style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX + 'px -' + gameEngine.tileSize * tilesetY + 'px';
                
                if (gameEngine.skills[oneChar.activeSkill] == undefined) {
                    const ccou = 1;
                }
                const ref2 = gameEngine.bodies[gameEngine.skills[oneChar.activeSkill].asset];
                const tilesetRank2 = ref2.rank;
                const tilesetX2 = tilesetRank2 % 64;
                const tilesetY2 = (tilesetRank2 - tilesetX2) / 64;
                document.getElementById('tl-skill-' + guid + '-icon').style.backgroundImage = "url('" + gameEngine.client.renderer.tileset.color.blobUrl + "')";
                document.getElementById('tl-skill-' + guid + '-icon').style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX2 + 'px -' + gameEngine.tileSize * tilesetY2 + 'px';
            }, this);
        }, this);
        //for (let activation in gameEngine.timeline.activationQueue) {
        //}
    },
    
    // #region frame
    getFrame : function () {
        return document.getElementById('uitcFrame');
    },
    
    hasFrame : function () {
        return this.getFrame() !== null;
    },
    
    drawFrame : function () {
        if (!this.hasFrame()) {
            this.parent.getMainWindows().appendChild(
                this.parent.createElementFromTemplate(this.template.frame));
        }
    },
    // #endregion

};
