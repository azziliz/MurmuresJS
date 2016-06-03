'use strict';

var gameEngine = new murmures.GameEngine();
gameEngine.client = {};
gameEngine.client.allowOrders = true;
gameEngine.client.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));
gameEngine.client.mouseMoveTarget = { x: -1 | 0, y: -1 | 0 };

// #region Utils
gameEngine.client.ws.onmessage = function (event) {
    let message = JSON.parse(event.data);
    if (message.fn === 'init') {
        let ge = message.payload;
        loadEngine(ge);
    }
    else if (message.fn === 'o') {
        let orderResponse = message.payload;
        onOrderResponse(orderResponse);
    }
};

function screenLog(txt) {
    let now = new Date();
    document.getElementById("screenLog").insertAdjacentHTML('afterbegin',
        '<span class="channel-debug"><span style="color:#ffa">' + now.toLocaleTimeString() + '.' + ('00' + now.getMilliseconds().toString()).substr(-3) + '</span> ' + txt + '<br></span>');
}

function onXhrError(e) {
    screenLog('<span style="color:#f66">' + 'ERROR - Vous avez été déconnecté du serveur</span>');
}
// #endregion

// #region Init
function init() {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("error", onXhrError);
    xhr.addEventListener("abort", onXhrError);
    xhr.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
            let percentComplete = parseInt(100.0 * evt.loaded / evt.total);
            document.getElementById('tilesetLoadProgress').style.width = percentComplete + '%';
        }
    });
    xhr.addEventListener("load", function (evt) {
        document.getElementById('tilesetLoadBg').style.display = 'none';
        let img = new Image();
        img.onload = function () {
            gameEngine.client.tilesetImg = img;
            tilesetLoaded();
        }
        gameEngine.client.tileset = window.URL.createObjectURL(this.response);
        img.src = gameEngine.client.tileset;
    });
    xhr.open('GET', '/src/img/murmures.png', true);
    xhr.responseType = "blob";
    xhr.send(null);
}

function restartGame() {
    gameEngine.client.ws.send(JSON.stringify({ service: 'restart' }));
}

function tilesetLoaded() {
    gameEngine.client.ws.send(JSON.stringify({ service: 'getLevel' }));
}

function loadEngine(engine) {
    gameEngine.initialize(engine);
    initUI();
    resetCanvas();
    drawTiles(gameEngine);
    registerEvents();
}
// #endregion

// #region Renderer
function resetCanvas() {
    let allCanvas = document.getElementsByTagName('canvas');
    for (let canvasIter = 0; canvasIter < allCanvas.length; canvasIter++) {
        allCanvas[canvasIter].width = gameEngine.level.width * gameEngine.tileSize; // This is a hard reset of all canvas and is quite time consumming.
        allCanvas[canvasIter].height = gameEngine.level.height * gameEngine.tileSize;
        let context = allCanvas[canvasIter].getContext('2d');
        context.imageSmoothingEnabled = false;
    }
}

function getCurrentHero() {
    let heroToReturn = null;
    let itHero = 0;
    while (heroToReturn == null && itHero < gameEngine.heros.length) {
        if (gameEngine.heros[itHero].stateOrder === murmures.C.STATE_HERO_ORDER_INPROGRESS) {
            heroToReturn = gameEngine.heros[itHero];
        }
        itHero++;
    }
    return heroToReturn;
}

// #region Tiles
function drawTiles(partialEngine) {
    if (typeof partialEngine !== 'undefined' && typeof partialEngine.level !== 'undefined' && typeof partialEngine.level.tiles !== 'undefined') {
        partialEngine.level.tiles.forEach(function (tileRow) {
            tileRow.forEach(function (tile) {
                drawOneTile(tile.x, tile.y);
            }, this);
        }, this);
    }
    updateUI();
}

function drawOneTile(x, y) {
    if (gameEngine.level.tiles[y][x].state !== murmures.C.TILE_NOT_DISCOVERED) {
        document.getElementById('fogOfWarLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
        document.getElementById('tilesLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
        drawOneLayer(x, y, 'groundId');
        drawOneLayer(x, y, 'groundDeco');
        drawOneLayer(x, y, 'propId');
        drawOneLayer(x, y, 'propDeco');
        drawOneLayer(x, y, 'itemId');
        drawOneLayer(x, y, 'effectId');
    }
    if (gameEngine.level.tiles[y][x].state === murmures.C.TILE_FOG_OF_WAR) {
        drawOneSquare(document.getElementById('fogOfWarLayer').getContext('2d'), x, y, "#000000", true);
    }
}

function drawOneLayer(x, y, layerId) {
    if (gameEngine.level.tiles[y][x][layerId] !== '') {
        let tilesetRank = gameEngine.bodies[gameEngine.level.tiles[y][x][layerId]].rank;
        let tilesetX = tilesetRank % 64;
        let tilesetY = (tilesetRank - tilesetX) / 64;
        document.getElementById('tilesLayer').getContext('2d').drawImage(gameEngine.client.tilesetImg,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
    }
}

function drawOneSquare(context, x, y, color, filled) {
    context.beginPath();
    if (filled || y === 0) {
        context.moveTo(gameEngine.tileSize * x, gameEngine.tileSize * y);
        context.lineTo(gameEngine.tileSize * x + gameEngine.tileSize, gameEngine.tileSize * y);
    }
    else {
        context.moveTo(gameEngine.tileSize * x + gameEngine.tileSize, gameEngine.tileSize * y);
    }
    context.lineTo(gameEngine.tileSize * x + gameEngine.tileSize, gameEngine.tileSize * y + gameEngine.tileSize);
    context.lineTo(gameEngine.tileSize * x, gameEngine.tileSize * y + gameEngine.tileSize);
    if (filled || x === 0) {
        context.lineTo(gameEngine.tileSize * x, gameEngine.tileSize * y);
    }
    context.strokeStyle = color;
    context.stroke();
    if (filled) {
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }
}

function drawTrail(sourceTile, destTile) {
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
    document.getElementById('trailLayer').getContext('2d').drawImage(gameEngine.client.tilesetImg,
                    sourceX * gameEngine.tileSize, sourceY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * sourceTile.x, gameEngine.tileSize * sourceTile.y, gameEngine.tileSize, gameEngine.tileSize);
    let destX = destRank % 64;
    let destY = (destRank - destX) / 64;
    document.getElementById('trailLayer').getContext('2d').drawImage(gameEngine.client.tilesetImg,
                    destX * gameEngine.tileSize, destY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * destTile.x, gameEngine.tileSize * destTile.y, gameEngine.tileSize, gameEngine.tileSize);
}

function queueProjectile(start, sourceTile, destTile) {
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
    animateProjectile(start, start + 100 * Math.max(absDeltaX, absDeltaY), 0, imgX, imgY, sourceTile, destTile)
}

function animateProjectile(start, end, timestamp, imgX, imgY, sourceTile, destTile) {
    let lerpRatio = (timestamp - start) / (end - start);
    let lerpX = sourceTile.x * (1 - lerpRatio) + destTile.x * lerpRatio;
    let lerpY = sourceTile.y * (1 - lerpRatio) + destTile.y * lerpRatio;
    document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
    document.getElementById('projectileLayer').getContext('2d').drawImage(gameEngine.client.tilesetImg,
                    imgX * gameEngine.tileSize, imgY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * lerpX, gameEngine.tileSize * lerpY, gameEngine.tileSize, gameEngine.tileSize);
    window.requestAnimationFrame(function (timestp) {
        if (timestp < end) animateProjectile(start, end, timestp, imgX, imgY, sourceTile, destTile);
        else document.getElementById('projectileLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
    });
}
// #endregion

// #region UI/Characters
function initUI() {
    let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
    document.getElementById('rightCharacters').innerHTML = '';
    gameEngine.level.uiMobCount = 0;
}

function updateUI() {
    if (gameEngine.state === murmures.C.STATE_ENGINE_DEATH) {
        document.getElementById('deathWindowTitle').innerHTML = gameEngine.locale.fr.ui['death_window_title'];
        document.getElementById('deathWindowRestartButton').innerHTML = gameEngine.locale.fr.ui['death_window_restart'];
        document.getElementById('deathWindow').style.display = "block";
    } else {
        document.getElementById('deathWindow').style.display = "none";
    }
    clearCharacterLayer();
    if (typeof gameEngine.level.mobs != 'undefined') {
        while (gameEngine.level.mobs.length > gameEngine.level.uiMobCount) {
            let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
            let templateStr = /template/g;
            document.getElementById('rightCharacters').insertAdjacentHTML('beforeend', characterUiTemplate.replace(templateStr, 'mob' + gameEngine.level.uiMobCount.toString()));
            gameEngine.level.uiMobCount++;
        }
        for (let i = 0; i < gameEngine.level.mobs.length; i++) {
            let ref = gameEngine.bodies[gameEngine.level.mobs[i].mobTemplate];
            let locale = gameEngine.locale.fr.bodies[gameEngine.level.mobs[i].mobTemplate];
            let tilesetRank = ref.rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('mob' + i + '-icon').style.backgroundImage = "url('" + gameEngine.client.tileset + "')";
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
            if (gameEngine.level.mobs[i].hitPoints === 0 || !gameEngine.level.mobs[i].onVision) {
                document.getElementById('mob' + i + '-box').style.display = "none";
            }
            else {
                document.getElementById('mob' + i + '-box').style.display = "block";
                drawCharacter(gameEngine.level.mobs[i]);
            }
        }
    }
    
    for (let i = 0; i < gameEngine.heros.length; i++) {
        let winHero = document.getElementById('hero' + gameEngine.heros[i].guid + '-box');
        if (typeof winHero === 'undefined' || winHero === null) {
            let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
            let templateStr = /template/g;
            winHero = document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, ('hero' + gameEngine.heros[i].guid)).replace('bgColorMob', 'bgColorHero'));
        }
        let winChar = document.getElementById('hero' + gameEngine.heros[i].guid + '-charname');
        let color = "#000";
        if (gameEngine.heros[i].stateOrder === murmures.C.STATE_HERO_ORDER_GIVEN) color = "#f00";
        if (gameEngine.heros[i].stateOrder === murmures.C.STATE_HERO_ORDER_INPROGRESS) color = "#0f0";
        winChar.style.borderColor = color;
        
        let ref = gameEngine.bodies[gameEngine.heros[i].mobTemplate];
        let locale = gameEngine.locale.fr.bodies[gameEngine.heros[i].mobTemplate];
        let tilesetRank = ref.rank;
        let tilesetX = tilesetRank % 64;
        let tilesetY = (tilesetRank - tilesetX) / 64;
        document.getElementById('hero' + gameEngine.heros[i].guid + '-icon').style.backgroundImage = "url('" + gameEngine.client.tileset + "')";
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
        drawCharacter(gameEngine.heros[i]);
    }
}


function clearCharacterLayer() {
    document.getElementById('characterLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
}

function drawCharacter(character) {
    let tilesetRank = gameEngine.bodies[character.mobTemplate].rank;
    let tilesetX = tilesetRank % 64;
    let tilesetY = (tilesetRank - tilesetX) / 64;
    if (gameEngine.level.tiles[character.position.y][character.position.x].state === murmures.C.TILE_HIGHLIGHTED) {
        document.getElementById('characterLayer').getContext('2d').drawImage(gameEngine.client.tilesetImg,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * character.position.x, gameEngine.tileSize * character.position.y, gameEngine.tileSize, gameEngine.tileSize);
    }

}
// #endregion
// #endregion

// #region Events
function registerEvents() {
    // IE11 returns decimal number for MouseEvent coordinates but Chrome43 always rounds down.
    // --> using floor() for consistency.
    // and retrieves the nearest pixel coordinates.
    let topLayer = document.getElementById('topLayer');
    topLayer.addEventListener('mousedown', function (e) {
        e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
        let targetedTile = getHoveredTile(e.offsetX, e.offsetY);
        topLayer_onClick(targetedTile, e.button === 2);
    }, false);
    topLayer.addEventListener('mousemove', function (e) {
        e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
        let targetedTile = getHoveredTile(e.offsetX, e.offsetY);
        topLayer_onMouseMove(targetedTile, e.button === 2);
    }, false);
    window.addEventListener('keypress', function (e) {
        let char = '';
        if (e.which === null)
            char = String.fromCharCode(e.keyCode);
        else
            char = String.fromCharCode(e.which);
        onKeyPress(char);
    }, false);
    
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

}

function topLayer_onMouseMove(hoveredTile, rightClick) {
    if (gameEngine.client.mouseMoveTarget.x !== hoveredTile.x || gameEngine.client.mouseMoveTarget.y !== hoveredTile.y) {
        let order = new murmures.Order();
        let currentHero = getCurrentHero();
        order.source = currentHero;
        order.target = hoveredTile;
        if (hoveredTile.hasMob.code) {
            order.command = 'attack';
        }
        else {
            order.command = 'move';
        }
        let check = gameEngine.checkOrder(order);
        document.getElementById('trailLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
        if (check.valid) {
            
            if (order.command === 'move') {
                window.requestAnimationFrame(function () {
                    drawTrail(order.source.position, order.target);
                });
            }
            else if (order.command === 'attack') {
                window.requestAnimationFrame(function (timestamp) {
                    queueProjectile(timestamp, order.source.position, order.target);
                });
            }
        }
        else {
        }
        gameEngine.client.mouseMoveTarget.x = hoveredTile.x;
        gameEngine.client.mouseMoveTarget.y = hoveredTile.y;
    }
}

function topLayer_onClick(hoveredTile, rightClick) {
    if (!rightClick) {
        // event is a left click
        // find hovered tile
        
        let currentHero = getCurrentHero();
        if (hoveredTile.hasMob.code) {
            let attackOrder = new murmures.Order();
            attackOrder.command = 'attack';
            attackOrder.source = currentHero;
            attackOrder.target = hoveredTile;
            launchOrder(attackOrder);
        }
        else {
            let moveOrder = new murmures.Order();
            moveOrder.command = 'move';
            moveOrder.source = currentHero;
            moveOrder.target = hoveredTile;
            launchOrder(moveOrder);
        }
    }
    else {
        // event is a right click
    }
}

function getHoveredTile(mouseEventX, mouseEventY) {
    let tileX = Math.floor(mouseEventX / gameEngine.tileSize);
    if (tileX < 0) tileX = 0;
    if (tileX >= gameEngine.level.width) tileX = gameEngine.level.width - 1;
    let tileY = Math.floor(mouseEventY / gameEngine.tileSize);
    if (tileY < 0) tileY = 0;
    if (tileY >= gameEngine.level.height) tileY = gameEngine.level.height - 1;
    return gameEngine.level.tiles[tileY][tileX];
}

function onKeyPress(char) {
    /*screenLog('keyboardEvent');
    let allowedChars = '12346789';
    if (allowedChars.indexOf(char) >= 0) {
        let moveOrder = new murmures.Order();
        moveOrder.command = 'move';
        moveOrder.source = gameEngine.heros[0];
        let target = new murmures.Tile(gameEngine.hero.position.x, gameEngine.hero.position.y);
        if (char === '9' || char === '6' || char === '3') target.x = gameEngine.hero.position.x + 1;
        if (char === '7' || char === '4' || char === '1') target.x = gameEngine.hero.position.x - 1;
        if (char === '8' || char === '2') target.x = gameEngine.hero.position.x;
        if (char === '9' || char === '8' || char === '7') target.y = gameEngine.hero.position.y - 1;
        if (char === '3' || char === '2' || char === '1') target.y = gameEngine.hero.position.y + 1;
        if (char === '4' || char === '6') target.y = gameEngine.hero.position.y;
        moveOrder.target = gameEngine.level.tiles[target.y][target.x];
        launchOrder(moveOrder);
    }
    else {
        screenLog('<span style="color:#f66">' + 'ERROR - This is not a valid key</span>');
    }*/
}
// #endregion

// #region Orders
function launchOrder(order) {
    screenLog('checkOrder');
    let check = gameEngine.checkOrder(order);
    if (gameEngine.client.allowOrders) {
        if (check.valid) {
            screenLog('>> order - ' + order.command);
            order.clean();
            gameEngine.client.ws.send(JSON.stringify({ service: 'order', payload: order }));
            gameEngine.client.allowOrders = false;
        }
        else {
            screenLog('<span style="color:#f66">' + 'ERROR - Invalid order - ' + check.reason + '</span>');
        }
    }
    else {
        screenLog('<span style="color:#f66">' + 'WARNING - Order was discarded - Waiting for server response </span>');
    }
}

function onOrderResponse(response) {
    screenLog('<< onOrderResponse');
    gameEngine.client.allowOrders = true;
    let ge = response;
    if (typeof ge === 'undefined') return;
    if (typeof ge.error !== 'undefined') {
        screenLog('<span style="color:#f66">' + 'ERROR - ' + ge.error + '</span>');
    }
    else {
        let isNewLevel = typeof ge.level !== 'undefined' && typeof ge.level.guid !== 'undefined' && gameEngine.level.guid !== ge.level.guid;
        gameEngine.synchronize(ge);
        if (isNewLevel) {
            initUI();
            resetCanvas();
            drawTiles(gameEngine);
        }
        else {
            drawTiles(ge);
        }
        if (gameEngine.state === murmures.C.STATE_ENGINE_DEATH) {
            screenLog('YOU DIE !');
        }
        //document.getElementById('debugDiv').innerHTML = '[ ' + gameEngine.hero.position.x + ' , '+ gameEngine.hero.position.y + ' ]';
        screenLog('UI updated');
    }
}
// #endregion
