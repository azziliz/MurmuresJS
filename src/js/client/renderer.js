'use strict';

gameEngine.classes.Renderer = function () {
    this.tileset = {
        color: {
            imgElement : {},
            blobUrl : {}
        },
        gray: {
            canvas : {},
            imgElement : {},
            blobUrl : {}
        },
    };
};

gameEngine.classes.Renderer.prototype = {
    init : function () {
        let instance = this;
        window.addEventListener('requestTileset', function (e) {
            instance.downloadColorTileset();
        }, false);
        window.addEventListener('requestHighlight', function (e) {
            instance.highlightLevel();
        }, false);
        window.addEventListener('colorTilesetReady', function (e) {
            instance.initGrayscaleTileset();
        }, false);
        window.addEventListener('grayscaleTilesetCreated', function (e) {
            instance.paintGrayscaleTileset();
        }, false);
        window.addEventListener('grayscaleTilesetPainted', function (e) {
            instance.storeGrayscaleTileset();
        }, false);
        window.addEventListener('grayscaleTilesetReady', function (e) {
            gameEngine.client.eventManager.emitEvent('tilesetReady');
        }, false);
        window.addEventListener('requestRenderFullEngine', function (e) {
            instance.resetCanvas();
            instance.drawTiles(gameEngine);
            instance.drawCharacters();
        }, false);
        window.addEventListener('requestRenderPartialEngine', function (e) {
            instance.drawTiles(e.detail);
            instance.clearCharacterLayer();
            instance.drawCharacters();
        }, false);
    },
    
    // #region tileset
    downloadColorTileset : function () {
        let instance = this;
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("error", gameEngine.client.eventManager.onXhrError);
        xhr.addEventListener("abort", gameEngine.client.eventManager.onXhrError);
        xhr.addEventListener("progress", function (evt) {
            if (evt.lengthComputable) {
                let percentComplete = parseInt(50.0 * evt.loaded / evt.total);
                gameEngine.client.eventManager.emitEvent('tilesetLoadProgress', percentComplete);
            }
        });
        xhr.addEventListener("load", function (evt) {
            let img = new Image();
            img.onload = function () {
                instance.tileset.color.imgElement = img;
                gameEngine.client.eventManager.emitEvent('colorTilesetReady');
            }
            instance.tileset.color.blobUrl = window.URL.createObjectURL(this.response); // closure is needed, otherwise at this point 'this' would be xhr
            img.src = instance.tileset.color.blobUrl;
        });
        xhr.open('GET', '/src/img/murmures.png', true);
        xhr.responseType = "blob";
        xhr.send(null);
    },
    
    initGrayscaleTileset : function () {
        let canvas = document.createElement('canvas');
        this.tileset.gray.canvas = canvas;
        canvas.width = this.tileset.color.imgElement.width;
        canvas.height = this.tileset.color.imgElement.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(this.tileset.color.imgElement, 0, 0);
        gameEngine.client.eventManager.emitEvent('tilesetLoadProgress', 55);
        window.setTimeout(function () { gameEngine.client.eventManager.emitEvent('grayscaleTilesetCreated') }, 0);
    },
    
    paintGrayscaleTileset : function () {
        let canvas = this.tileset.gray.canvas;
        let ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 2239, canvas.width, 2465 - 2239);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // red
            data[i + 1] = avg; // green
            data[i + 2] = avg; // blue
            // do not change alpha value
        }
        ctx.putImageData(imageData, 0, 2239);
        gameEngine.client.eventManager.emitEvent('tilesetLoadProgress', 80);
        window.setTimeout(function () { gameEngine.client.eventManager.emitEvent('grayscaleTilesetPainted') }, 0);
    },
    
    storeGrayscaleTileset : function () {
        let canvas = this.tileset.gray.canvas;
        // Code below is slightly faster (than toDataURL) on chrome51 but breaks IE11 compatibility.
        // Keeping it in comment for now.
        //canvas.toBlob(function (blob) {
        //    gameEngine.client.tilesetGray = window.URL.createObjectURL(blob);
        //    let img = new Image();
        //    img.onload = function () {
        //        gameEngine.client.tilesetImgGray = img;
        //        screenLog('loaded2');
        //        tilesetLoaded();
        //    }
        //    img.src = gameEngine.client.tilesetGray;
        //});
        let instance = this;
        let img = new Image();
        img.onload = function () {
            instance.tileset.gray.imgElement = img;
            gameEngine.client.eventManager.emitEvent('grayscaleTilesetReady');
        }
        instance.tileset.gray.blobUrl = canvas.toDataURL();
        img.src = instance.tileset.gray.blobUrl;
        gameEngine.client.eventManager.emitEvent('tilesetLoadProgress', 95);
    },
    // #endregion
    
    resetCanvas : function () {
        // TODO : have a window the size of the viewport that hides canvas overflow and centers on the heroes
        // http://jsfiddle.net/NUNNf/4/
        // https://www.kirupa.com/html5/clipping_content_using_css.htm
        
        [].forEach.call(document.getElementsByTagName('canvas'), function (canvas) {
            canvas.width = gameEngine.level.width * gameEngine.tileSize; // This is a hard reset of all canvas and is quite time consumming.
            canvas.height = gameEngine.level.height * gameEngine.tileSize;
            let context = canvas.getContext('2d');
            context.imageSmoothingEnabled = false;
        });
    },
    
    highlightLevel : function () {
        for (let x = 0; x < gameEngine.level.width; x++) {
            for (let y = 0; y < gameEngine.level.height; y++) {
                gameEngine.level.tiles[y][x].state = murmures.C.TILE_HIGHLIGHTED;
            }
        }
    },
    
    // #region tiles
    drawTiles : function (partialEngine) {
        for (let y = 0; y < gameEngine.level.height; y++) {
            for (let x = 0; x < gameEngine.level.width; x++) {
                if (gameEngine.level.tiles[y][x].state === murmures.C.TILE_HIGHLIGHTED) {
                    document.getElementById('fogOfWarLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
                }
            }
        }
        if (typeof partialEngine !== 'undefined' && typeof partialEngine.level !== 'undefined' && typeof partialEngine.level.tiles !== 'undefined') {
            partialEngine.level.tiles.forEach(function (tileRow) {
                tileRow.forEach(function (tile) {
                    this.drawOneTile(tile.x, tile.y);
                }, this);
            }, this);
        }
    },
    
    drawOneTile : function (x, y) {
        if (gameEngine.level.tiles[y][x].state !== murmures.C.TILE_NOT_DISCOVERED) {
            document.getElementById('tilesLayer').getContext('2d').clearRect(gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
            this.drawOneLayer(x, y, 'groundId');
            this.drawOneLayer(x, y, 'groundDeco');
            this.drawOneLayer(x, y, 'propId');
            this.drawOneLayer(x, y, 'propDeco');
            this.drawOneLayer(x, y, 'itemId');
            this.drawOneLayer(x, y, 'effectId');
        }
        if (gameEngine.level.tiles[y][x].state === murmures.C.TILE_FOG_OF_WAR) {
            this.drawOneSquare(document.getElementById('fogOfWarLayer').getContext('2d'), x, y, "#000000", true);
        }
    },
    
    drawOneLayer : function (x, y, layerId) {
        if (gameEngine.level.tiles[y][x][layerId] !== '') {
            let tilesetRank = gameEngine.bodies[gameEngine.level.tiles[y][x][layerId]].rank;
            let tilesetX = tilesetRank % 64;
            let tilesetY = (tilesetRank - tilesetX) / 64;
            document.getElementById('tilesLayer').getContext('2d').drawImage(this.tileset.color.imgElement,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * x, gameEngine.tileSize * y, gameEngine.tileSize, gameEngine.tileSize);
        }
    },
    
    drawOneSquare : function (context, x, y, color, filled) {
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
    },
    // #endregion
    
    // #region characters
    clearCharacterLayer : function () {
        document.getElementById('characterLayer').getContext('2d').clearRect(0, 0, gameEngine.level.width * gameEngine.tileSize, gameEngine.level.height * gameEngine.tileSize);
    },
    
    drawCharacters : function () {
        if (typeof gameEngine.level.mobs != 'undefined') {
            for (let i = 0; i < gameEngine.level.mobs.length; i++) {
                // TODO : move mobIsSeen to murmures.Character
                let mobIsSeen = false;
                for (let itVision in gameEngine.level.mobs[i].onVisionCharacters) {
                    if (gameEngine.level.mobs[i].onVisionCharacters[itVision]) {
                        mobIsSeen = true;
                        break;
                    }
                }
                
                if (gameEngine.level.mobs[i].hitPoints === 0 || !mobIsSeen) {
                }
                else {
                    this.drawCharacter(gameEngine.level.mobs[i]);
                }
            }
        }
        for (let i = 0; i < gameEngine.heros.length; i++) {
            this.drawCharacter(gameEngine.heros[i]);
        }
    },
    
    drawCharacter : function (character) {
        let tilesetRank = gameEngine.bodies[character.mobTemplate].rank;
        let tilesetX = tilesetRank % 64;
        let tilesetY = (tilesetRank - tilesetX) / 64;
        if (gameEngine.level.tiles[character.position.y][character.position.x].state === murmures.C.TILE_HIGHLIGHTED) {
            document.getElementById('characterLayer').getContext('2d').drawImage(
                !character.isHero || character.stateOrder === murmures.C.STATE_HERO_ORDER_INPROGRESS ? this.tileset.color.imgElement : this.tileset.gray.imgElement,
                    tilesetX * gameEngine.tileSize, tilesetY * gameEngine.tileSize, gameEngine.tileSize, gameEngine.tileSize,
                    gameEngine.tileSize * character.position.x, gameEngine.tileSize * character.position.y, gameEngine.tileSize, gameEngine.tileSize);
        }
    },
    // #endregion
    

};