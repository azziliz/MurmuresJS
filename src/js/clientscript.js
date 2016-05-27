'use strict';

var gameEngine = new murmures.GameEngine();
gameEngine.allowOrders = true;

// #region Utils
function screenLog(txt) {
    let now = new Date();
    document.getElementById("screenLog").insertAdjacentHTML('afterbegin',
        '<span class="channel-debug"><span style="color:#ffa">' + now.toLocaleTimeString() + '.' + ('00' + now.getMilliseconds().toString()).substr(-3) + '</span> ' + txt + '<br></span>');
}

function sendAjax(path, param, callback, async) {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("error", onXhrError);
    xhr.addEventListener("abort", onXhrError);
    xhr.open('POST', path, async);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (callback !== null) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        };
    }
    xhr.send(param);
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
        gameEngine.tileset = window.URL.createObjectURL(this.response);
        let img = new Image();
        img.onload = function () {
            tilesetLoaded();
        }
        img.src = gameEngine.tileset;
    });
    xhr.open('GET', '/src/img/murmures.png', true);
    xhr.responseType = "blob";
    xhr.send(null);
}

function tilesetLoaded() {
    sendAjax('/getLevel', '{"id":"level1"}', loadEngine, true);
    registerEvents();
}

function loadEngine(engine) {
    gameEngine.initialize(JSON.parse(engine));
    initUI();
    renderLevel();
}
// #endregion

// #region Renderer
function renderLevel() {
    let allCanvas = document.getElementsByTagName('canvas');
    for (let canvasIter = 0; canvasIter < allCanvas.length; canvasIter++) {
        allCanvas[canvasIter].width = gameEngine.level.width * gameEngine.tileSize; // This is a hard reset of all canvas and is quite time consumming.
        allCanvas[canvasIter].height = gameEngine.level.height * gameEngine.tileSize;
        let context = allCanvas[canvasIter].getContext('2d');
        context.imageSmoothingEnabled = false;
    }
    //document.getElementById('screenLog').style.top = (10 + gameEngine.level.height * gameEngine.tileSize).toString() + 'px';
    drawTiles();
    updateUI();
}

// #region Tiles
function drawTiles() {
    document.getElementById('fogOfWarLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
    for (let x = 0; x < gameEngine.level.width; x++) {
        for (let y = 0; y < gameEngine.level.height; y++) {
            drawOneTile(x, y, '#2D1E19');
        }
    }
}

function drawOneTile(x, y, color) {
    let img = new Image();
    img.src = gameEngine.tileset;
    if (gameEngine.level.tiles[y][x].state !== murmures.C.TILE_NOT_DISCOVERED) {
        if (true) { // TODO: erase only tiles that come from the synchronized object
            document.getElementById('tilesLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize)
            document.getElementById('propsLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize)
        }
        if (gameEngine.level.tiles[y][x].groundId !== "") {
            let tilesetRank = gameEngine.bodies[gameEngine.level.tiles[y][x].groundId].rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('tilesLayer').getContext('2d').drawImage(img,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
        }
        if (gameEngine.level.tiles[y][x].propId !== "") {
            let tilesetRank = gameEngine.bodies[gameEngine.level.tiles[y][x].propId].rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('propsLayer').getContext('2d').drawImage(img,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
        }
    }
    if (gameEngine.level.tiles[y][x].state === murmures.C.TILE_FOG_OF_WAR) {
        drawOneSquare(document.getElementById('fogOfWarLayer').getContext('2d'), x, y, "#000000", true);
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
// #endregion

// #region UI/Characters
function initUI() {
    document.getElementById('rightCharacters').innerHTML = '';
    document.getElementById('leftCharacters').innerHTML =
    '<a href="/src/pages/bodyeditor.html" style="float:left; clear: left;">body editor</a><br>' +
    '<a href="/src/pages/leveleditor.html" style="float:left; clear: left;">level editor</a><br>' +
    '<a href="/src/pages/test.html" style="float:left; clear: left;">test</a><br>' +
    '<code id="screenLog" style="position:relative; top:10px; margin:2px 7px; width:136px; height:300px; z-index:9999; color:white; overflow:auto; display: block;"></code>';
    let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
    let templateStr = /template/g;
    for (let i = 0; i < gameEngine.level.mobs.length; i++) {
        document.getElementById('rightCharacters').insertAdjacentHTML('beforeend', characterUiTemplate.replace(templateStr, 'mob' + i));
    }
    document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, 'hero0').replace('bgColorMob', 'bgColorHero'));

}

function updateUI() {
    clearCharacterLayer();
    if (gameEngine.level.mobs != undefined) {
        for (let i = 0; i < gameEngine.level.mobs.length; i++) {
            let ref = gameEngine.bodies[gameEngine.level.mobs[i].mobTemplate];
            let locale = gameEngine.locale.fr.bodies[gameEngine.level.mobs[i].mobTemplate];
            let tilesetRank = ref.rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('mob' + i + '-icon').style.backgroundImage = "url('" + gameEngine.tileset + "')";
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
    let i = 0;
    let ref = gameEngine.bodies[gameEngine.hero.mobTemplate];
    let locale = gameEngine.locale.fr.bodies[gameEngine.hero.mobTemplate];
    let tilesetRank = ref.rank;
    let tilesetX = tilesetRank % 64;
    let tilesetY = (tilesetRank - tilesetX) / 64;
    document.getElementById('hero' + i + '-icon').style.backgroundImage = "url('" + gameEngine.tileset + "')";
    document.getElementById('hero' + i + '-icon').style.backgroundPosition = '-' + gameEngine.tileSize * tilesetX + 'px -' + gameEngine.tileSize * tilesetY + 'px';
    let namediv = document.getElementById('hero' + i + '-name');
    let namedivwidth = window.getComputedStyle(namediv, null).width;
    namediv.innerHTML = locale || 'Name Error';
    let namefontsize = 100;
    while (window.getComputedStyle(namediv, null).width != namedivwidth) {
        namefontsize--;
        namediv.style.fontSize = namefontsize.toString() + '%';
    }
    let missingLife = parseFloat(gameEngine.hero.hitPoints) / parseFloat(gameEngine.hero.hitPointsMax) * 100.0;
    document.getElementById('hero' + i + '-life').style.width = Math.round(missingLife).toString() + '%';
    drawCharacter(gameEngine.hero);
}

function clearCharacterLayer() {
    document.getElementById('characterLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
}

function drawCharacter(character) {
    /// <param name="character" type="Character"/>
    let img = new Image();
    img.src = gameEngine.tileset;
    let tilesetRank = gameEngine.bodies[character.mobTemplate].rank;
    let tilesetX = tilesetRank % 64;
    let tilesetY = (tilesetRank - tilesetX) / 64;
    if (gameEngine.level.tiles[character.position.y][character.position.x].state === murmures.C.TILE_HIGHLIGHTED) {
        document.getElementById('characterLayer').getContext('2d').drawImage(img,
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
    let topLayer = document.getElementById("topLayer");
    topLayer.addEventListener("mousedown", function (e) {
        e.preventDefault(); // usually, keeping the left mouse button down triggers a text selection or a drag & drop.
        let mouseX = Math.floor(e.offsetX);
        let mouseY = Math.floor(e.offsetY);
        topLayer_onClick(mouseX, mouseY, e.button === 2);
    }, false);
    window.addEventListener("keypress", function (e) {
        let char = '';
        if (e.which === null)
            char = String.fromCharCode(e.keyCode);
        else
            char = String.fromCharCode(e.which);
        onKeyPress(char);
    }, false);
}

function topLayer_onClick(mouseEventX, mouseEventY, rightClick) {
    screenLog('mouseEvent');
    if (!rightClick) {
        // event is a left click
        // find hovered tile
        let hoveredTile = getHoveredTile(mouseEventX, mouseEventY);
        if (gameEngine.tileHasMob(hoveredTile).code === true) {
            let attackOrder = new murmures.Order();
            attackOrder.command = "attack";
            attackOrder.source = gameEngine.hero;
            attackOrder.target = hoveredTile;
            launchOrder(attackOrder);
        }
        else {
            let moveOrder = new murmures.Order();
            moveOrder.command = "move";
            moveOrder.source = gameEngine.hero;
            moveOrder.target = hoveredTile;
            launchOrder(moveOrder);
        }
    }
    else {
        // event is a right click
        let hoveredTile = getHoveredTile(mouseEventX, mouseEventY);
    }
}

function getHoveredTile(mouseEventX, mouseEventY) {
    let tileX = Math.floor(mouseEventX / gameEngine.tileSize);
    let tileY = Math.floor(mouseEventY / gameEngine.tileSize);    
    return gameEngine.level.tiles[tileY][tileX];
}

function onKeyPress(char) {
    screenLog('keyboardEvent');
    let allowedChars = '12346789';
    if (allowedChars.indexOf(char) >= 0) {
        let moveOrder = new murmures.Order();
        moveOrder.command = "move";
        moveOrder.source = gameEngine.hero;
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
    }
}
// #endregion

// #region Ajax
function launchOrder(order) {
    screenLog('checkOrder');
    let check = gameEngine.checkOrder(order);
    if (gameEngine.allowOrders) {
        if (check.valid) {
            screenLog('>> order - ' + order.command);
            order.clean();
            sendAjax('/order', JSON.stringify(order), onOrderResponse, true);
            gameEngine.allowOrders = false;
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
    gameEngine.allowOrders = true;
    let ge = JSON.parse(response);
    if (typeof ge.error != 'undefined') {
        screenLog('<span style="color:#f66">' + 'ERROR - ' + ge.error + '</span>');
    }
    else {
        let isNewLevel = (ge.activeLevel != undefined) && (gameEngine.activeLevel !== ge.activeLevel);
        gameEngine.synchronize(ge);
        if (isNewLevel) {
            initUI();
            renderLevel();
        }
        else {
            drawTiles();
            updateUI();
        }
        document.getElementById('debugDiv').innerHTML = '[ ' + gameEngine.hero.position.x + ' , '+ gameEngine.hero.position.y + ' ]';
        screenLog('UI updated');
    }
}
// #endregion