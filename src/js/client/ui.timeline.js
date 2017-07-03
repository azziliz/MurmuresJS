'use strict';

murmures.UiTimelineComponent = function () {
    // #region templates
    this.template = {
        frame : '<div id="uitcFrame" class="uitcFrame"></div>',
        mark : '<div id="uitcMark_{id}" class="uitcMark"></div>',
        markicons : '<div id="uitcMarkIcons_{id}" class="uitcMark"></div>',
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
            instance.refresh();
        }, false);
        this.drawFrame();
    },
    
    refresh : function () {
        if (this.hasFrame()) {
            this.getFrame().innerHTML = '';
        }
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
