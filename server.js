'use strict';

console.log(''); // new line
var vm = require('vm');
var fs = require('fs');
var zlib = require('zlib');
var http = require('http');
var WebSocketServer = require("ws").Server

/**
 * Declares the gameEngine variable for a later use.
 * This variable will be set to an instance of murmures.GameEngine after all classes are loaded.
 * @instance
 * @type {murmures.GameEngine}
 */
var gameEngine = {};

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
    },

    restartGame: function (targetLevel) {
        gameEngine.levels = [];
        gameEngine.activeLevel = 0;
        gameEngine.levelIds = fs.readdirSync('./data/staticlevels/', 'utf8');
        let loopCounter = 0;
        gameEngine.levelIds.forEach(function (levelName) {
            let level1Txt = fs.readFileSync('./data/staticlevels/' + levelName, 'utf8').toString().replace(/^\uFEFF/, '');
            let level1 = new murmures.Level();
            level1.build(JSON.parse(level1Txt));
            level1.id = levelName.replace('.json', '');
            gameEngine.levels.push(level1);
            if (typeof targetLevel !== 'undefined' && targetLevel && targetLevel === levelName) {
                gameEngine.activeLevel = loopCounter;
            }
            loopCounter++;
        }, this);
        gameEngine.level = gameEngine.levels[gameEngine.activeLevel];

        gameEngine.heros = [];
        let allHeroesKeys = [];
        for (let assetId in gameEngine.bodies) {
            let ref = gameEngine.bodies[assetId];
            if (murmures.C.LAYERS[ref.layerId][0] === 'Hero') allHeroesKeys.push(assetId);
        }

        let chosenHeroesKeys = [];
        let chosenHero;
        for (loopCounter = 0; loopCounter < 3; loopCounter++) {
            do {
                let rand = Math.floor(Math.random() * allHeroesKeys.length);
                chosenHero = allHeroesKeys[rand];
            } while (chosenHeroesKeys.indexOf(chosenHero) >= 0); // This loop prevents duplicate heroes
            chosenHeroesKeys.push(chosenHero);
            let hero1 = new murmures.Character();
            hero1.build(gameEngine.level.getStartingPoint(), chosenHero);
            if (loopCounter === 0) {
                hero1.setVision();
                hero1.stateOrder = murmures.C.STATE_HERO_ORDER_INPROGRESS;
            }
            hero1.skills[1] = gameEngine.skills[1];
            hero1.skills[3] = gameEngine.skills[3];
            hero1.activeSkill = 1;
            gameEngine.heros.push(hero1);
        }
//        gameEngine.heros[1].skills[1] = gameEngine.skills[3];
        gameEngine.reportQueue = [];
        gameEngine.state = murmures.C.STATE_ENGINE_INIT;
    }
};

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
    let turnReportjs = fs.readFileSync('./src/js/core/turnreport.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(turnReportjs, ctx, { filename: 'turnreport.js' });
    let physicalBodyjs = fs.readFileSync('./src/js/core/physicalbody.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(physicalBodyjs, ctx, { filename: 'physicalbody.js' });
    let behaviorjs = fs.readFileSync('./src/js/core/behavior.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(behaviorjs, ctx, { filename: 'behavior.js' });
    let skillbehaviorjs = fs.readFileSync('./src/js/core/skillbehavior.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(skillbehaviorjs, ctx, { filename: 'skillbehavior.js' });
    let skilljs = fs.readFileSync('./src/js/core/skill.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(skilljs, ctx, { filename: 'skill.js' });
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
    let assetsJson = fs.readFileSync('./data/reference/assets.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.bodies = JSON.parse(assetsJson);

    let localefrJson = fs.readFileSync('./data/locale/fr.json', 'utf8').toString().replace(/^\uFEFF/, '');
    let localeenJson = fs.readFileSync('./data/locale/en.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.locale = {};
    gameEngine.locale.fr = JSON.parse(localefrJson);
    gameEngine.locale.en = JSON.parse(localeenJson);

    let localSkills = JSON.parse(fs.readFileSync('./data/reference/skill.json', 'utf8').toString().replace(/^\uFEFF/, ''));
    for (let skillName in localSkills){
      let tempSkill = new murmures.Skill();
      tempSkill.build(localSkills[skillName],skillName);
      gameEngine.skills[tempSkill.id] = tempSkill;
    }
    murmures.restartGame();
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
                    //gameEngine.gameTurn++;
                    murmures.serverLog('Order checked');
                    let beforeState = gameEngine.clone(); // TODO : clone AFTER the turn.
                    murmures.serverLog('State saved');
                    gameEngine.saveOrder(clientOrder);

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
        else if (message.service === 'restart') {
            murmures.restartGame(message.payload);
            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({ fn: 'init', payload: gameEngine }));
            });
        }
        else if (message.service === 'test') {
            let test = new murmures.ServerTest();
            test.run(require);
        }
        else {
            murmures.serverLog('Received an incorrect request:' + messageTxt.toString());
        }
    });
});

murmures.serverLog('Listening on http://127.0.0.1:' + (process.env.PORT || 15881).toString() + '/');
