'use strict';

gameEngine.classes.UiManager = function () {
    // #region templates
    this.template = {
        logHeader : '<header> \
<ul id="tabs"> \
<li data-target="clientLog" class="">Client log</li> \
<li data-target="serverLog">Server log</li> \
<li data-target="devTools">Dev tools</li> \
</ul> \
</header>', 
        logTabs : '<div id="tabContent"> \
<div data-title="clientLog" class=""> \
<code id="screenLog" style="margin: 3px 3px 3px 7px; height: 300px; z-index: 9999; color: white; overflow: auto; display: block;"></code> \
</div> \
<div data-title="serverLog"> \
test3<br>test4 \
</div> \
<div data-title="devTools"> \
<a href="/src/pages/leveleditor.html" style="float:left; clear: left;">level editor</a><br> \
<a href="/src/pages/test.html" style="float:left; clear: left;">server benchmark</a><br> \
<a href="/src/pages/pathfinding.html" style="float:left; clear: left;">pathfinding test page</a><br> \
<select id="levelSelect"></select> \
<button id="changeLevel">load</button><br> \
</div> \
</div>', 
        progressBar : '<div id="tilesetLoadBg" class="tilesetLoad"> \
    <div id="tilesetLoadProgress"></div> \
</div>',
    };
    // #endregion
}

gameEngine.classes.UiManager.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('requestTileset', function (e) {
            instance.drawProgressBar();
        }, false);
        window.addEventListener('requestDevTools', function (e) {
            instance.drawFullLogHeader();
            window.addEventListener('engineReceivedFromServer', function (e) {
                instance.loadDevTools(e.detail);
            }, false);

        }, false);
        window.addEventListener('tilesetLoadProgress', function (e) {
            instance.updateProgressBar(e.detail);
        }, false);
        window.addEventListener('grayscaleTilesetReady', function (e) {
            instance.hideProgressBar();
        }, false);
        window.addEventListener('requestCrawlUi', function (e) {
            instance.drawCrawlUi();
        }, false);
    },
    
    createElementFromTemplate : function (txt) {
        let div = document.createElement('div');
        div.innerHTML = txt;
        return div.firstChild;
    },
    
    // #region logs
    getLog : function () {
        return document.getElementById('screenLog');
    },
    
    hasLog : function () {
        return this.getLog() !== null;
    },
    
    drawFullLogHeader : function () {
        document.body.appendChild(this.createElementFromTemplate(this.template.logHeader));
        document.body.appendChild(this.createElementFromTemplate(this.template.logTabs));
        let tabsLi = document.getElementById('tabs').childNodes;
        for (let liIter = 0; liIter < tabsLi.length; liIter++) {
            tabsLi[liIter].addEventListener('mousedown', function (e) {
                e.preventDefault();
                let target = this.dataset.target;
                let contentDiv = document.getElementById('tabContent').childNodes;
                for (let contentIter=0; contentIter < contentDiv.length; contentIter++) {
                    if (typeof contentDiv[contentIter].dataset !== 'undefined' &&
                    contentDiv[contentIter].dataset.title === target) {
                        // target found
                        if (this.classList.contains('selected')) {
                            this.classList.remove('selected');
                            contentDiv[contentIter].classList.remove('show');
                        }
                        else {
                            [].forEach.call(document.getElementById('tabs').childNodes, function (elt) {
                                if (elt.nodeName === 'LI') elt.classList.remove('selected');
                            });
                            [].forEach.call(document.getElementById('tabContent').childNodes, function (elt) {
                                if (elt.nodeName === 'DIV') elt.classList.remove('show');
                            });
                            this.classList.add('selected');
                            contentDiv[contentIter].classList.add('show');
                        }
                    }
                }
            }, false);
        }
        let changeLevelButton = document.getElementById('changeLevel');
        changeLevelButton.addEventListener('mousedown', function (e) {
            gameEngine.client.ws.send(JSON.stringify({ service: 'restart', payload: document.getElementById('levelSelect').value }));
        }, false);

    },
    
    log : function (txt, channel) {
        if (this.hasLog()) {
            let now = new Date();
            this.getLog().insertAdjacentHTML('afterbegin',
            '<span class="channel-debug"><span style="color:#ffa">' + now.toLocaleTimeString() + '.' + ('00' + now.getMilliseconds().toString()).substr(-3) + '</span> ' + txt + '<br></span>');
        }
    },
    // #endregion
    
    // #region progress bar
    getProgressBar : function () {
        return document.getElementById('tilesetLoadBg');
    },
    
    hasProgressBar : function () {
        return this.getProgressBar() !== null;
    },
    
    drawProgressBar : function () {
        if (!this.hasProgressBar()) {
            document.body.appendChild(this.createElementFromTemplate(this.template.progressBar));
        }
    },
    
    updateProgressBar : function (percentComplete) {
        if (this.hasProgressBar()) {
            document.getElementById('tilesetLoadProgress').style.width = percentComplete + '%';
        }
    },
    
    hideProgressBar : function () {
        if (this.hasProgressBar()) {
            this.getProgressBar().style.display = 'none';
        }
    },
    // #endregion

    // #region dev tools
    loadDevTools : function (ge) {
        if (document.getElementById('levelSelect') !== null) {
            document.getElementById('levelSelect').innerHTML = '';
            ge.levelIds.forEach(function (levelId) {
                let opt = document.createElement("option");
                opt.value = levelId;
                opt.text = levelId.replace('.json', '');
                document.getElementById('levelSelect').add(opt);
            }, this);
        }
    },
    // #endregion
    
    // #region main UI
    drawCrawlUi : function () {

    },
    // #endregion
    


};
