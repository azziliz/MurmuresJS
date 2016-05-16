'use strict';

const vm = require('vm');
const fs = require('fs');

var murmures = {
    serverLog: function (txt) {
        console.log(''.concat((new Date()).toISOString(), ' - ', txt));
    }
};

var gameEngine = {};

// Load
(function () {    
    const ctx = {
        murmures: murmures,
        gameEngine: {}
    };
    vm.createContext(ctx);

    let constantsjs = fs.readFileSync('./src/constants.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(constantsjs, ctx, { filename: 'constants.js' });
    let gameEnginejs = fs.readFileSync('./src/gameEngine.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(gameEnginejs, ctx, { filename: 'gameEngine.js' });
    
    ctx.gameEngine = new murmures.GameEngine();

    let playerjs = fs.readFileSync('./src/player.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(playerjs, ctx, { filename: 'player.js' });
    let tilejs = fs.readFileSync('./src/tile.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(tilejs, ctx, { filename: 'tile.js' });
    let leveljs = fs.readFileSync('./src/level.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(leveljs, ctx, { filename: 'level.js' });
    let characterjs = fs.readFileSync('./src/character.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(characterjs, ctx, { filename: 'character.js' });
    let orderjs = fs.readFileSync('./src/order.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(orderjs, ctx, { filename: 'order.js' });
    let physicalBodyjs = fs.readFileSync('./src/physicalBody.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(physicalBodyjs, ctx, { filename: 'physicalBody.js' });

    gameEngine = ctx.gameEngine;
})();


//var txt = JSON.stringify(gameEngine.mobsReference);

// Tries to compress (gzip) the response, if the client browser allows it
function compressAndSend(request, response, contType, txt) {
    var acceptEncoding = request.headers['accept-encoding'];
    if (!acceptEncoding) {
        acceptEncoding = '';
    }
    if (acceptEncoding.match(/\bgzip\b/)) {
        response.writeHead(200, { 'Content-Type': contType, 'Content-Encoding': 'gzip' });
        response.end(require('zlib').gzipSync(txt));
    } else {
        response.writeHead(200, { 'Content-Type': contType });
        response.end(txt);
    }
}

require('http').createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        compressAndSend(request, response, 'text/html', require('fs').readFileSync('client.html').toString());
        
        gameEngine.tileSize = 32;
        
        let bodiesJson = require('fs').readFileSync('./data/bodies.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.bodies = JSON.parse(bodiesJson);
        
        let mobsJson = require('fs').readFileSync('./data/mobs.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.mobsReference = JSON.parse(mobsJson);
        
        gameEngine.hero = new murmures.Character();
        let hero1Txt = require('fs').readFileSync('./data/hero1.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.hero.fromJson(JSON.parse(hero1Txt));
        gameEngine.hero.instanciate(gameEngine.mobsReference[gameEngine.hero.mobTemplate]);
        
        gameEngine.level = new murmures.Level();
        let level1Txt = require('fs').readFileSync('./data/level2.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.level.fromJson(JSON.parse(level1Txt));
        gameEngine.hero.position = gameEngine.level.heroStartingTiles[0];
        
        gameEngine.loadMobs();

    }
    else if (request.url.startsWith('/src/')) {
        // #region Static Pages
        try {
            let fileName = request.url;
            let fileContent = require('fs').readFileSync('.' + fileName);
            if (fileName.endsWith('.js')) {
                compressAndSend(request, response, 'application/javascript', fileContent.toString());
            }
            else if (fileName.endsWith('.css')) {
                compressAndSend(request, response, 'text/css', fileContent.toString());
            }
            else if (fileName.endsWith('.png')) {
                compressAndSend(request, response, 'image/png', fileContent);
            }
            else if (fileName.endsWith('.html')) {
                compressAndSend(request, response, 'text/html', fileContent.toString());
            }
            else {
                response.writeHead(400); // Bad Request
                response.end();
            }
        } catch (e) {
            response.writeHead(404);
            response.end();
        }
        // #endregion
    }
    else {
        let buffer = '';
        request.on('data', function (chunk) {
            buffer = buffer.concat(chunk.toString());
            if (buffer.length > 1e6) request.connection.destroy(); // Prevent buffer overflow attacks
        });
        request.on('end', function () {
            if (request.url === '/getLevel') {
                let postData = JSON.parse(buffer);
                if ((postData === null) 
                    || (postData.id === null)) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Wrong request.' }));
                }
                else {
                    compressAndSend(request, response, 'application/json', JSON.stringify(gameEngine));
                }
            } else if (request.url === '/order') {
                let postData = JSON.parse(buffer);
                if ((postData === null) 
                  || (postData.command === null) 
                  || (postData.source === null) 
                  || (postData.target === null)) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Wrong request.' }));
                }
                else {
                    let clientOrder = new murmures.Order();
                    clientOrder.fromJsonSafe(postData);
                    let check = gameEngine.checkOrder(clientOrder);
                    if (check.valid) {
                        gameEngine.applyOrder(clientOrder);
                        compressAndSend(request, response, 'application/json', JSON.stringify(gameEngine));
                    }
                    else {
                        compressAndSend(request, response, 'application/json', JSON.stringify({ error: check.reason }));
                    }
                }
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }
}).listen(15881);

murmures.serverLog('Server running at http://127.0.0.1:15881/');
