'use strict';

console.log(''); // new line
var vm = require('vm');
var fs = require('fs');
var zlib = require('zlib');
var http = require('http');

/**
 * The main namespace. All classes should be prefixed with it.
 * @namespace
 */
var murmures = {
    /**
     * Startup time.
     * @private
     */
    startTime: process.hrtime(),
    
    /**
     * Writes timestamped log to the console.
     * @public
     */
    serverLog: function (txt) {
        let diff = process.hrtime(this.startTime);
        console.log((diff[0] + diff[1] / 1e9).toFixed(6) + ' - ' + txt);
    }
};

/**
 * Declares the gameEngine variable for a later use.
 * This variable will be set to an instance of murmures.GameEngine after all classes are loaded.
 * @instance
 */
var gameEngine = {};

murmures.serverLog('Loading classes');

/**
 * Loads classes into the murmures namespace
 */
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
    let behaviorjs = fs.readFileSync('./src/behavior.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(behaviorjs, ctx, { filename: 'behavior.js' });

    gameEngine = ctx.gameEngine;
})();

murmures.serverLog('Initializing game');

/**
 * Initializes game
 */
(function () {
    gameEngine.tileSize = 32;
    
    let bodiesJson = fs.readFileSync('./data/bodies.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.bodies = JSON.parse(bodiesJson);
    
    gameEngine.hero = new murmures.Character();
    let hero1Txt = fs.readFileSync('./data/hero1.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.hero.fromJson(JSON.parse(hero1Txt));
    gameEngine.hero.instantiate(gameEngine.bodies[gameEngine.hero.mobTemplate]);
        
    gameEngine.levels = [];
    gameEngine.levelIds = ["level2", "level1", "level4", "level5"];
    gameEngine.levelIds.forEach(function (levelName) {
        let level1 = new murmures.Level();
        let level1Txt = fs.readFileSync('./data/' + levelName + '.json', 'utf8').toString().replace(/^\uFEFF/, '');
        level1.fromJson(JSON.parse(level1Txt));
        level1.instantiateMobs();
        gameEngine.levels.push(level1);
    }, this);
    gameEngine.activeLevel = 0;
    gameEngine.level = gameEngine.levels[gameEngine.activeLevel];
    gameEngine.level.moveHeroToStartingPoint();

    gameEngine.hero.setVision();
})();

murmures.serverLog('Starting HTTP server');

// Tries to compress (gzip) the response, if the client browser allows it
function compressAndSend(request, response, contType, txt, callback) {
    let acceptEncoding = request.headers['accept-encoding'];
    if (!acceptEncoding) {
        acceptEncoding = '';
    }
    if (acceptEncoding.match(/\bgzip\b/) && contType !== 'image/png') {
        zlib.gzip(txt, function (err, zipped) {
            if (err) throw err;
            response.writeHead(200, { 'Content-Type': contType, 'Content-Encoding': 'gzip' });
            response.end(zipped, 'utf8', callback);
        });
    } else if (contType === 'image/png') {
        let stats = fs.statSync('./src/img/murmures.png');
        response.writeHead(200, { 'Content-Type': contType, 'Content-Length': stats.size });
        response.end(txt);
    } else {
        response.writeHead(200, { 'Content-Type': contType });
        response.end(txt);
    }
}

http.createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        response.writeHead(301, { 'Location': '/src/pages/client.html' });
        response.end();
    }
    else if (request.url.startsWith('/src/')) {
        // #region Static Pages
        try {
            let fileName = request.url;
            fs.readFile('.' + fileName, function (err, fileContent) {
                if (err) throw err;
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
            });
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
                if ((postData === null) || 
                    (postData.id === null)) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Wrong request.' }));
                }
                else {
                    compressAndSend(request, response, 'application/json', JSON.stringify(gameEngine));
                }
            } else if (request.url === '/order') {
                let postData = JSON.parse(buffer);
                if ((postData === null) || 
                    (postData.command === null) || 
                    (postData.source === null) || 
                    (postData.target === null)) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Wrong request.' }));
                }
                else {
                    murmures.serverLog('Request received');
                    let clientOrder = new murmures.Order();
                    clientOrder.fromJsonSafe(postData);
                    let check = gameEngine.checkOrder(clientOrder);
                    murmures.serverLog('Order checked');
                    if (check.valid) {
                        gameEngine.applyOrder(clientOrder);
                        murmures.serverLog('Order applied');
                        let res = JSON.stringify(gameEngine.getMinimal());
                        murmures.serverLog('Response stringified');
                        compressAndSend(request, response, 'application/json', res, function () { murmures.serverLog('Response sent'); });
                    }
                    else {
                        compressAndSend(request, response, 'application/json', JSON.stringify({ error: check.reason }));
                    }
                    murmures.serverLog('Response sending');
                }
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }
}).listen(process.env.PORT || 15881);

murmures.serverLog('Listening on http://127.0.0.1:' + (process.env.PORT || 15881).toString() + '/');
