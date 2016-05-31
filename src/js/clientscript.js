'use strict';

var gameEngine = new murmures.GameEngine();
gameEngine.allowOrders = true;
gameEngine.ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

// #region Utils
gameEngine.ws.onmessage = function (event) {
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

function restartGame(){
  gameEngine.ws.send(JSON.stringify({service:'restart'}));
}

function tilesetLoaded() {
    gameEngine.ws.send(JSON.stringify({service:'getLevel'}));
    registerEvents();
}

function loadEngine(engine) {
    gameEngine.initialize(engine);
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
    drawTiles(gameEngine);
    updateUI();
}

// #region Tiles
function drawTiles(partialEngine) {
    if (typeof partialEngine.level.tiles !== "undefined") {
        partialEngine.level.tiles.forEach(function (tileRow) {
            tileRow.forEach(function (tile) {
                drawOneTile(tile.x, tile.y, '#2D1E19');
            }, this);
        }, this);
    }

}

function drawOneTile(x, y, color) {
    let img = new Image();
    img.src = gameEngine.tileset;
    if (gameEngine.level.tiles[y][x].state !== murmures.C.TILE_NOT_DISCOVERED) {
        if (true) { // TODO: erase only tiles that come from the synchronized object
            document.getElementById('fogOfWarLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
            document.getElementById('tilesLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
            document.getElementById('propsLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
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
    let additionalLinks =
    '<a href="/src/pages/bodyeditor.html" style="float:left; clear: left;">body editor</a><br>' +
    '<a href="/src/pages/leveleditor.html" style="float:left; clear: left;">level editor</a><br>' +
    '<a href="/src/pages/test.html" style="float:left; clear: left;">test</a><br>' +
    '<code id="screenLog" style="position:relative; top:10px; margin:2px 7px; width:136px; height:300px; z-index:9999; color:white; overflow:auto; display: block;"></code>';
    let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
    document.getElementById('rightCharacters').innerHTML = '';
    let templateStr = /template/g;

    gameEngine.level.uiMobCount = 0;

    //for (let i = 0; i < gameEngine.level.mobs.length; i++) {
    //    document.getElementById('rightCharacters').insertAdjacentHTML('beforeend', characterUiTemplate.replace(templateStr, 'mob' + i));
    //}
    if (document.getElementById('leftCharacters').innerHTML.length <= additionalLinks.length) {
        document.getElementById('leftCharacters').innerHTML = additionalLinks;
        //document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, 'hero0').replace('bgColorMob', 'bgColorHero'));
        //document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, 'hero1').replace('bgColorMob', 'bgColorHero'));
    }
}

function updateUI() {
    if(gameEngine.state == murmures.C.STATE_ENGINE_DEATH){
      document.getElementById("deathWindow").style.display = "block";
    }else{
      document.getElementById("deathWindow").style.display = "None";
    }
    clearCharacterLayer();
    if (gameEngine.level.mobs != undefined) {
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

    for (let i = 0; i < gameEngine.heros.length; i++) {
      let winHero = document.getElementById('hero' + gameEngine.heros[i].guid + '-icon');
      if (winHero == undefined){
        let characterUiTemplate = document.getElementById('characterUiTemplate').innerHTML;
        let templateStr = /template/g;
        document.getElementById('leftCharacters').insertAdjacentHTML('afterbegin', characterUiTemplate.replace(templateStr, ('hero' + gameEngine.heros[i].guid)).replace('bgColorMob', 'bgColorHero'));
      }
      let ref = gameEngine.bodies[gameEngine.heros[i].mobTemplate];
      let locale = gameEngine.locale.fr.bodies[gameEngine.heros[i].mobTemplate];
      let tilesetRank = ref.rank;
      let tilesetX = tilesetRank % 64;
      let tilesetY = (tilesetRank - tilesetX) / 64;
      document.getElementById('hero' + gameEngine.heros[i].guid + '-icon').style.backgroundImage = "url('" + gameEngine.tileset + "')";
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
            attackOrder.source = gameEngine.heros[0];
            attackOrder.target = hoveredTile;
            launchOrder(attackOrder);
        }
        else {
            let moveOrder = new murmures.Order();
            moveOrder.command = "move";
            moveOrder.source = gameEngine.heros[0];
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
    }
}
// #endregion

// #region Orders
function launchOrder(order) {
    screenLog('checkOrder');
    let check = gameEngine.checkOrder(order);
    if (gameEngine.allowOrders) {
        if (check.valid) {
            screenLog('>> order - ' + order.command);
            order.clean();
            gameEngine.ws.send(JSON.stringify({ service: 'order', payload: order}));
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
    let ge = response;
    if (typeof ge.error != 'undefined') {
        screenLog('<span style="color:#f66">' + 'ERROR - ' + ge.error + '</span>');
    }
    else {
        let isNewLevel = (typeof ge.level !== 'undefined') && (typeof ge.level.guid !== 'undefined') && (gameEngine.level.guid !== ge.level.guid);
        gameEngine.synchronize(ge);

        if (isNewLevel) {
            initUI();
            renderLevel();
        }
        else {
            drawTiles(ge);
            updateUI();
        }
        if (gameEngine.state == murmures.C.STATE_ENGINE_DEATH){
          screenLog('YOU DIE !');
        }
        //document.getElementById('debugDiv').innerHTML = '[ ' + gameEngine.hero.position.x + ' , '+ gameEngine.hero.position.y + ' ]';
        screenLog('UI updated');

    }
}
// #endregion
