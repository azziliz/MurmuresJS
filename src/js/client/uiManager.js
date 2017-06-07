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
        debugDiv : '<div style="position:fixed; bottom:0; left:0; z-index:9999"> \
<div id="debugDiv"></div> \
</div>',
        progressBar : '<div id="tilesetLoadBg" class="tilesetLoad"> \
<div id="tilesetLoadProgress"></div> \
</div>',
        mainWindow : '<div id="mainWindow" class="fullScreen"> \
</div>',
        leftCharacterPanel : '<div id="leftCharacters" class="zUI" style="float:left"> \
</div>',
        rightCharacterPanel : '<div id="rightCharacters" class="zUI" style="float:right"> \
</div>',
        crawlPanel : '<div id="crawl" style="position:relative; float:left;"> \
<canvas id="tilesLayer" width="1400" height="840" style="z-index: 15"></canvas> \
<canvas id="fogOfWarLayer" width="1400" height="840" style="z-index: 25; opacity:0.5"></canvas> \
<canvas id="trailLayer" width="1400" height="840" style="z-index: 30"></canvas> \
<canvas id="characterLayer" width="1400" height="840" style="z-index: 35"></canvas> \
<canvas id="projectileLayer" width="1400" height="840" style="z-index: 40"></canvas> \
<canvas id="topLayer" width="1400" height="840" style="z-index: 99"></canvas> \
</div>',
        deathWindow : '<div id="deathWindow" class="deathWindow" style="display:none;"> \
<p style="position:absolute;left:150px;font-size:200%;" id="deathWindowTitle"></p> \
<p style="position:absolute;left:150px;top:200px;font-size:200%;"><a href="#" onclick="restartGame();" id="deathWindowRestartButton"></a></p> \
</div>',
        characterTemplate : '<div id="template-box" class="characterBox bgColorMob" data-order=""> \
<div> \
<div id="template-icon" class="uiIcon charIcon"> \
</div> \
<div id="template-charname" class="characterName"> \
<div id="template-name">Chauve-souris</div> \
</div> \
<div id="template-fullLife" class="newLine characterLife"> \
<div id="template-life"></div> \
<div id="template-hptooltip" class="tooltip">?/?</div> \
</div> \
<div id="template-skill1" class="newLine uiIcon"></div> \
<div id="template-skill2" class="uiIcon"></div> \
<div id="template-skill3" class="uiIcon"></div> \
<div id="template-skill4" class="uiIcon"></div> \
<div id="template-skill5" class="uiIcon"></div> \
<div id="template-skill6" class="newLine uiIcon"></div> \
<div id="template-skill7" class="uiIcon"></div> \
<div id="template-skill8" class="uiIcon"></div> \
<div id="template-skill9" class="uiIcon"></div> \
<div id="template-skill10" class="uiIcon"></div> \
</div> \
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
        window.addEventListener('initializeCrawl', function (e) {
            instance.clearAllCharacters();
            instance.updateUI();
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
        document.body.appendChild(this.createElementFromTemplate(this.template.debugDiv));
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
    
    // #region draw main UI elements
    getMainWindows : function () {
        return document.getElementById('mainWindow');
    },
    
    hasMainWindows : function () {
        return this.getMainWindows() !== null;
    },
    
    drawCrawlUi : function () {
        if (!this.hasMainWindows()) {
            this.drawMainWindow();
            this.drawLeftCharacterPanel();
            this.drawCrawlPanel();
            this.drawRightCharacterPanel();
            this.drawDeathWindow();
        }
        gameEngine.client.eventManager.emitEvent('mainWindowReady');
    },
    
    drawMainWindow : function () {
        document.body.appendChild(this.createElementFromTemplate(this.template.mainWindow));
    },
    
    drawLeftCharacterPanel : function () {
        this.getMainWindows().appendChild(this.createElementFromTemplate(this.template.leftCharacterPanel));
    },
    
    drawRightCharacterPanel : function () {
        this.getMainWindows().appendChild(this.createElementFromTemplate(this.template.rightCharacterPanel));
    },
    
    drawCrawlPanel : function () {
        this.getMainWindows().appendChild(this.createElementFromTemplate(this.template.crawlPanel));
    },
    
    drawDeathWindow : function () {
        document.body.appendChild(this.createElementFromTemplate(this.template.deathWindow));
    },
    // #endregion
    
    // #region update ui
    clearAllCharacters : function () {
        if (this.hasMainWindows()) {
            document.getElementById('leftCharacters').innerHTML = '';
            document.getElementById('rightCharacters').innerHTML = '';
            gameEngine.level.uiMobCount = 0;
        }
    },

    updateUI : function () {
        if (gameEngine.state === murmures.C.STATE_ENGINE_DEATH) {
            document.getElementById('deathWindowTitle').innerHTML = gameEngine.locale.fr.ui['death_window_title'];
            document.getElementById('deathWindowRestartButton').innerHTML = gameEngine.locale.fr.ui['death_window_restart'];
            document.getElementById('deathWindow').style.display = "block";
        } else {
            document.getElementById('deathWindow').style.display = "none";
        }
        if (typeof gameEngine.level.mobs != 'undefined') {
            while (gameEngine.level.mobs.length > gameEngine.level.uiMobCount) {
                let characterUiTemplate = this.template.characterTemplate;
                let templateStr = /template/g;
                document.getElementById('rightCharacters').insertAdjacentHTML('beforeend', characterUiTemplate.replace(templateStr, 'mob' + gameEngine.level.uiMobCount.toString()));
                document.getElementById('mob' + gameEngine.level.uiMobCount.toString() + '-fullLife').addEventListener('mousemove', function (e) {
                // TODO  bug #136
                //document.getElementById('mob' + gameEngine.level.uiMobCount.toString() + '-hptooltip').innerHTML = gameEngine.level.mobs[gameEngine.level.uiMobCount].hitPoints + '/' + gameEngine.level.mobs[gameEngine.level.uiMobCount].hitPointsMax;
                }, false);
                gameEngine.level.uiMobCount++;
            }
            for (let i = 0; i < gameEngine.level.mobs.length; i++) {
                let ref = gameEngine.bodies[gameEngine.level.mobs[i].mobTemplate];
                let locale = gameEngine.locale.fr.assets[gameEngine.level.mobs[i].mobTemplate];
                let tilesetRank = ref.rank;
                let tilesetX = tilesetRank % 64;
                let tilesetY = (tilesetRank - tilesetX) / 64;
                document.getElementById('mob' + i + '-icon').style.backgroundImage = "url('" + gameEngine.client.renderer.tileset.color.blobUrl + "')";
                document.getElementById('mob' + i + '-icon').style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX + 'px -' + gameEngine.tileSize * tilesetY + 'px';
                let namediv = document.getElementById('mob' + i + '-name');
                let namedivwidth = window.getComputedStyle(namediv, null).width;
                namediv.innerHTML = locale || 'Name Error';
                let namefontsize = 100;
                while (window.getComputedStyle(namediv, null).width != namedivwidth) {
                    namefontsize--;
                    namediv.style.fontSize = namefontsize.toString() + '%';
                }
                let missingLife = parseFloat(gameEngine.level.mobs[i].hitPoints) / parseFloat(gameEngine.level.mobs[i].hitPointsMax) * 100.0;
                document.getElementById('mob' + i + '-life').style.width = Math.round(missingLife).toString() + '%';
                
                let mobIsSeen = false;
                for (let itVision in gameEngine.level.mobs[i].onVisionCharacters) {
                    if (gameEngine.level.mobs[i].onVisionCharacters[itVision]) {
                        mobIsSeen = true;
                        break;
                    }
                }
                
                if (gameEngine.level.mobs[i].hitPoints === 0 || !mobIsSeen) {
                    document.getElementById('mob' + i + '-box').style.display = "none";
                }
                else {
                    document.getElementById('mob' + i + '-box').style.display = "block";
                }
            }
        }
        
        gameEngine.heros.sort(function (h1, h2) { return h1.stateOrder - h2.stateOrder; });
        for (let i = 0; i < gameEngine.heros.length; i++) {
            let winHero = document.getElementById('hero' + gameEngine.heros[i].guid + '-box');
            if (typeof winHero === 'undefined' || winHero === null) {
                let characterUiTemplate = this.template.characterTemplate;
                let templateStr = /template/g;
                document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, ('hero' + gameEngine.heros[i].guid)).replace('bgColorMob', 'bgColorHero'));
                document.getElementById('hero' + gameEngine.heros[i].guid + '-box').addEventListener('mouseenter', function (e) {
                    //herobox_onMouseEnter(e);
                }, false);
                document.getElementById('hero' + gameEngine.heros[i].guid + '-box').addEventListener('mouseleave', function (e) {
                    //herobox_onMouseLeave(e);
                }, false);
                document.getElementById('hero' + gameEngine.heros[i].guid + '-fullLife').addEventListener('mousemove', function (e) {
                    document.getElementById('hero' + gameEngine.heros[i].guid + '-hptooltip').innerHTML = gameEngine.heros[i].hitPoints + '/' + gameEngine.heros[i].hitPointsMax;
                }, false);
            }
            let winChar = document.getElementById('hero' + gameEngine.heros[i].guid + '-charname');
            let color = "#222";
            if (gameEngine.heros[i].stateOrder === murmures.C.STATE_HERO_ORDER_GIVEN) color = "#800";
            if (gameEngine.heros[i].stateOrder === murmures.C.STATE_HERO_ORDER_INPROGRESS) color = "#080";
            winChar.style.borderColor = color;
            
            let ref = gameEngine.bodies[gameEngine.heros[i].mobTemplate];
            let locale = gameEngine.locale.fr.assets[gameEngine.heros[i].mobTemplate];
            let tilesetRank = ref.rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('hero' + gameEngine.heros[i].guid + '-icon').style.backgroundImage = "url('" + gameEngine.client.renderer.tileset.color.blobUrl + "')";
            document.getElementById('hero' + gameEngine.heros[i].guid + '-icon').style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX + 'px -' + gameEngine.tileSize * tilesetY + 'px';
            let namediv = document.getElementById('hero' + gameEngine.heros[i].guid + '-name');
            let namedivwidth = window.getComputedStyle(namediv, null).width;
            namediv.innerHTML = locale || 'Name Error';
            let namefontsize = 100;
            while (window.getComputedStyle(namediv, null).width != namedivwidth) {
                namefontsize--;
                namediv.style.fontSize = namefontsize.toString() + '%';
            }
            let missingLife = parseFloat(gameEngine.heros[i].hitPoints) / parseFloat(gameEngine.heros[i].hitPointsMax) * 100.0;
            document.getElementById('hero' + gameEngine.heros[i].guid + '-life').style.width = Math.round(missingLife).toString() + '%';
            this.drawSkill(gameEngine.heros[i]);
        }    },
    
    drawSkill : function (hero) {
        let nbSkill = 1;
        let instance = this;
        for (let itSkill in hero.skills) {
            let skill = hero.skills[itSkill];
            let ref = gameEngine.bodies[skill.asset];
            let tilesetRank = ref.rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            let skillWindow = document.getElementById('hero' + hero.guid + '-skill' + nbSkill);
            skillWindow.style.backgroundImage = "url('" + gameEngine.client.renderer.tileset.color.blobUrl + "')";
            skillWindow.style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX + 'px -' + gameEngine.tileSize * tilesetY + 'px';
            skillWindow.style.backgroundColor = "#ffffff";
            // TODO bug bug bug :  this add a new listener every time the selected skill is changed
            skillWindow.addEventListener("click", function () { instance.activeSkill(hero.guid, skill.id); });
            // TODO : change to css behavior
            if (hero.activeSkill == skill.id) {
                skillWindow.style.border = "1px solid";
                skillWindow.style.borderColor = "#44DD44";
            } else {
                skillWindow.style.border = "0px";
            }
            nbSkill++;
        }
    },
    
    activeSkill : function (heroGuid, skillId) {
        for (let h in gameEngine.heros) {
            if (gameEngine.heros[h].guid == heroGuid) {
                gameEngine.heros[h].activeSkill = skillId;
                this.drawSkill(gameEngine.heros[h]);
                break;
            }
        }
    },
    // #endregion
    


};
