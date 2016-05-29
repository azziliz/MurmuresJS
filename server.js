'use strict';

console.log(''); // new line
var vm = require('vm');
var fs = require('fs');
var zlib = require('zlib');
var http = require('http');
var WebSocketServer = require("ws").Server

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
        let fdiff = diff[0] + diff[1] / 1e9;
        if (typeof txt !== 'undefined') {
            console.log(fdiff.toFixed(6) + ' - ' + txt);
        }
        return fdiff;
    }
};

/**
 * Declares the gameEngine variable for a later use.
 * This variable will be set to an instance of murmures.GameEngine after all classes are loaded.
 * @instance
 * @type {murmures.GameEngine}
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

    let constantsjs = fs.readFileSync('./src/js/core/constants.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(constantsjs, ctx, { filename: 'constants.js' });
    let gameEnginejs = fs.readFileSync('./src/js/core/gameengine.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(gameEnginejs, ctx, { filename: 'gameengine.js' });

    ctx.gameEngine = new murmures.GameEngine();

    let playerjs = fs.readFileSync('./src/js/core/player.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(playerjs, ctx, { filename: 'player.js' });
    let tilejs = fs.readFileSync('./src/js/core/tile.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(tilejs, ctx, { filename: 'tile.js' });
    let leveljs = fs.readFileSync('./src/js/core/level.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(leveljs, ctx, { filename: 'level.js' });
    let characterjs = fs.readFileSync('./src/js/core/character.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(characterjs, ctx, { filename: 'character.js' });
    let orderjs = fs.readFileSync('./src/js/core/order.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(orderjs, ctx, { filename: 'order.js' });
    let physicalBodyjs = fs.readFileSync('./src/js/core/physicalbody.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(physicalBodyjs, ctx, { filename: 'physicalbody.js' });
    let behaviorjs = fs.readFileSync('./src/js/core/behavior.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(behaviorjs, ctx, { filename: 'behavior.js' });

    let vmperfjs = fs.readFileSync('./src/js/test/vmperf.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(vmperfjs, ctx, { filename: 'vmperf.js' });
    let servertestjs = fs.readFileSync('./src/js/test/servertest.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(servertestjs, ctx, { filename: 'servertest.js' });

    gameEngine = ctx.gameEngine;
})();

murmures.serverLog('Initializing game');

/**
 * Initializes game
 */
(function () {
    let bodiesJson = fs.readFileSync('./data/bodies.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.bodies = JSON.parse(bodiesJson);

    let localefrJson = fs.readFileSync('./data/locale/fr.json', 'utf8').toString().replace(/^\uFEFF/, '');
    let localeenJson = fs.readFileSync('./data/locale/en.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.locale = {};
    gameEngine.locale.fr = JSON.parse(localefrJson);
    gameEngine.locale.en = JSON.parse(localeenJson);
    
    gameEngine.levels = [];
    gameEngine.levelIds = ["level1", "level2", "level4", "level5"];
    gameEngine.levelIds.forEach(function (levelName) {
        let level1Txt = fs.readFileSync('./data/' + levelName + '.json', 'utf8').toString().replace(/^\uFEFF/, '');
        let level1 = new murmures.Level();
        level1.build(JSON.parse(level1Txt));
        gameEngine.levels.push(level1);
    }, this);
    gameEngine.activeLevel = 0;
    gameEngine.level = gameEngine.levels[gameEngine.activeLevel];

    let hero1Txt = fs.readFileSync('./data/hero1.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.hero = new murmures.Character();
    gameEngine.hero.build(gameEngine.level.getStartingPoint(), JSON.parse(hero1Txt).mobTemplate);

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
            murmures.serverLog('Response compressed');
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

var server = http.createServer(function (request, response) {
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
        response.writeHead(404);
        response.end();
    }
}).listen(process.env.PORT || 15881);

var wss = new WebSocketServer({ server: server })
wss.on('connection', function (ws) {
    ws.on('message', function (messageTxt) {
        let message = JSON.parse(messageTxt);
        if (message.service === 'getLevel') {
            ws.send(JSON.stringify({ fn: 'init', payload: gameEngine }));
        }
        else if (message.service === 'order') {
            murmures.serverLog('Request received');
            let clientOrder = new murmures.Order();
            let parsing = clientOrder.build(message.payload);
            if (parsing.valid) {
                let check = gameEngine.checkOrder(clientOrder);
                if (check.valid) {
                    gameEngine.gameTurn++;
                    murmures.serverLog('Order checked');
                    let beforeState = gameEngine.clone(); // TODO : clone AFTER the turn.
                    murmures.serverLog('State saved');
                    gameEngine.applyOrder(clientOrder);
                    murmures.serverLog('Order applied');
                    let ge = gameEngine.compare(beforeState);
                    let res = JSON.stringify({ fn: 'o', payload: ge });
                    murmures.serverLog('Response stringified');
                    // broadcast to all clients
                    wss.clients.forEach(function each(client) {
                        client.send(res);
                    });
                }
                else {
                    ws.send(JSON.stringify({ fn: 'o', payload: { error: check.reason } }));
                }
            }
            else {
                ws.send(JSON.stringify({ fn: 'o', payload: { error: parsing.reason } }));
            }
            murmures.serverLog('Response sent');
        }
        else if (message.service === 'test') {
            let test = new murmures.ServerTest();
            test.run(require);
        }
    });
});

murmures.serverLog('Listening on http://127.0.0.1:' + (process.env.PORT || 15881).toString() + '/');
