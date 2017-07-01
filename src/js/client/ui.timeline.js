'use strict';

murmures.UiTimelineComponent = function () {
    // #region templates
    this.template = {
        frame : '<div id="uitcFrame" class="uitcFrame"></div>',
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
        window.addEventListener('requestTimelineClick', function (e) {

        }, false);
        window.addEventListener('animationTick', function (e) {

        }, false);
        this.drawFrame();
    },
    
    refresh : function () {
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
            this.parent.getMainWindows().insertBefore(
                this.parent.createElementFromTemplate(this.template.frame),
            this.parent.getMainWindows().lastChild);
        }
    },
    // #endregion

};
