'use strict';

console.log(''); // new line
var vm = require('vm');
var fs = require('fs');
var zlib = require('zlib');
var http = require('http');
var WebSocketServer = require("ws").Server // this is a dependency. See package.json
var serverLoggers = [];

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
    serverLog: function (txt, details) {
        const diff = process.hrtime(this.startTime);
        const fdiff = diff[0] + diff[1] / 1e9;
        if (typeof txt !== 'undefined') {
            if (typeof txt === 'object') {
                console.log(fdiff.toFixed(6) + ' - %o' , txt);
            } else {
                console.log(fdiff.toFixed(6) + ' - ' + txt);
            }
        }
        serverLoggers.forEach(function (ws) {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ fn: 'log', payload: { timestamp: fdiff.toFixed(6), summary: txt, details: details } }));
            }
        }, this);
        return fdiff;
    },
    
    restartGame: function (targetLevel) {
        const timeline1 = new murmures.Timeline();
        timeline1.build();
        timeline1.nextKeyframe = 1;
        gameEngine.timeline = timeline1;
        
        gameEngine.levels = [];
        gameEngine.activeLevel = 0;
        gameEngine.levelIds = fs.readdirSync('./data/staticlevels/', 'utf8').sort();
        let loopCounter = 0;
        gameEngine.levelIds.forEach(function (levelName) {
            const level1Txt = fs.readFileSync('./data/staticlevels/' + levelName, 'utf8').toString().replace(/^\uFEFF/, '');
            const level1 = new murmures.Level();
            level1.build(JSON.parse(level1Txt));
            level1.id = levelName.replace('.json', '');
            gameEngine.levels.push(level1);
            if (typeof targetLevel !== 'undefined' && targetLevel && targetLevel === levelName) {
                gameEngine.activeLevel = loopCounter;
            }
            loopCounter++;
        }, this);
        gameEngine.level = gameEngine.levels[gameEngine.activeLevel];
        gameEngine.level.mobs.forEach(function (mob) {
            const order1 = new murmures.Order();
            order1.command = 'move';
            order1.source = mob;
            order1.target = mob.position;
            const activation1 = new murmures.Activation();
            activation1.build({
                startTick : 0,
                endTick : 9,
                remainingWork : 0,
                order : order1
            });
            timeline1.activationQueue[mob.guid] = activation1;
        }, this);
        
        gameEngine.heros = [];
        const allHeroesKeys = [];
        Object.keys(gameEngine.bodies).forEach(function (assetId) {
            const ref = gameEngine.bodies[assetId];
            if (murmures.C.LAYERS[ref.layerId][0] === 'Hero') allHeroesKeys.push(assetId);
        });
        
        const chosenHeroesKeys = [];
        let chosenHero;
        for (loopCounter = 0; loopCounter < 3; loopCounter++) {
            do {
                const rand = Math.floor(Math.random() * allHeroesKeys.length);
                chosenHero = allHeroesKeys[rand];
            } while (chosenHeroesKeys.indexOf(chosenHero) >= 0); // This loop prevents duplicate heroes
            chosenHeroesKeys.push(chosenHero);
            let hero1 = new murmures.Character();
            hero1.build(gameEngine.level.getEntrance(), chosenHero, 2);
            if (loopCounter === 0) {
                hero1.setVision();
            }            
            gameEngine.heros.push(hero1);
            
            const order1 = new murmures.Order();
            order1.command = 'wait';
            order1.source = hero1;
            order1.target = hero1.position;
            const activation1 = new murmures.Activation();
            activation1.build({
                startTick : 0,
                endTick : loopCounter + 1,
                remainingWork : 0,
                order : order1
            });
            timeline1.activationQueue[hero1.guid] = activation1;
        }        
        gameEngine.timeline.tick();        
        gameEngine.reportQueue = [];
        gameEngine.state = murmures.C.STATE_ENGINE_INIT;
    },
    
    clientScripts : {},
    coreScripts : {},
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

    const constantsjs = fs.readFileSync('./src/js/core/constants.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(constantsjs, ctx, { filename: 'constants.js' });
    const gameEnginejs = fs.readFileSync('./src/js/core/gameengine.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(gameEnginejs, ctx, { filename: 'gameengine.js' });

    ctx.gameEngine = new murmures.GameEngine();

    const utilsjs = fs.readFileSync('./src/js/core/utils.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(utilsjs, ctx, { filename: 'utils.js' });
    const playerjs = fs.readFileSync('./src/js/core/player.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(playerjs, ctx, { filename: 'player.js' });
    const tilejs = fs.readFileSync('./src/js/core/tile.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(tilejs, ctx, { filename: 'tile.js' });
    const leveljs = fs.readFileSync('./src/js/core/level.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(leveljs, ctx, { filename: 'level.js' });
    const characterjs = fs.readFileSync('./src/js/core/character.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(characterjs, ctx, { filename: 'character.js' });
    const orderjs = fs.readFileSync('./src/js/core/order.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(orderjs, ctx, { filename: 'order.js' });
    const turnReportjs = fs.readFileSync('./src/js/core/turnreport.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(turnReportjs, ctx, { filename: 'turnreport.js' });
    const physicalBodyjs = fs.readFileSync('./src/js/core/physicalbody.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(physicalBodyjs, ctx, { filename: 'physicalbody.js' });
    const behaviorjs = fs.readFileSync('./src/js/core/behavior.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(behaviorjs, ctx, { filename: 'behavior.js' });
    const skilljs = fs.readFileSync('./src/js/core/skill.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(skilljs, ctx, { filename: 'skill.js' });
    const activationjs = fs.readFileSync('./src/js/core/activation.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(activationjs, ctx, { filename: 'activation.js' });
    const timelinejs = fs.readFileSync('./src/js/core/timeline.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(timelinejs, ctx, { filename: 'timeline.js' });
    const vmperfjs = fs.readFileSync('./src/js/test/vmperf.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(vmperfjs, ctx, { filename: 'vmperf.js' });
    const servertestjs = fs.readFileSync('./src/js/test/servertest.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(servertestjs, ctx, { filename: 'servertest.js' });
    const pathfindingjs = fs.readFileSync('./src/js/core/pathfinding.js', 'utf8').toString().replace(/^\uFEFF/, '');
    vm.runInContext(pathfindingjs, ctx, { filename: 'pathfinding.js' });

    gameEngine = ctx.gameEngine;
})();

murmures.serverLog('Initializing game');

/**
 * Initializes game
 */
(function () {
    const assetsJson = fs.readFileSync('./data/reference/assets.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.bodies = JSON.parse(assetsJson);
    
    const localefrJson = fs.readFileSync('./data/locale/fr.json', 'utf8').toString().replace(/^\uFEFF/, '');
    const localeenJson = fs.readFileSync('./data/locale/en.json', 'utf8').toString().replace(/^\uFEFF/, '');
    gameEngine.locale = {};
    gameEngine.locale.fr = JSON.parse(localefrJson);
    gameEngine.locale.en = JSON.parse(localeenJson);
    
    const localSkills = JSON.parse(fs.readFileSync('./data/reference/skill.json', 'utf8').toString().replace(/^\uFEFF/, ''));
    Object.keys(localSkills).forEach(function (skillName) {
        const tempSkill = new murmures.Skill();
        tempSkill.build(localSkills[skillName], skillName);
        gameEngine.skills[skillName] = tempSkill;
    });
    
    murmures.clientScripts = '\uFEFF'; // BOM
    ['base', 'renderer', 'ui', 'ui.timeline', 'animation', 'order', 'input', 'event', 'client'].forEach(function (scriptName) {
        murmures.clientScripts += fs.readFileSync('./src/js/client/' + scriptName + '.js', 'utf8').toString().replace(/^\uFEFF/, '') + '\n\n';
    }, this);
    murmures.coreScripts = '\uFEFF'; // BOM
    ['clientbase', 'constants', 'utils', 'skill', 'character', 'level', 'order', 'turnreport', 'tile', 'pathfinding', 'activation', 'timeline', 'gameengine'].forEach(function (scriptName) {
        murmures.coreScripts += fs.readFileSync('./src/js/core/' + scriptName + '.js', 'utf8').toString().replace(/^\uFEFF/, '') + '\n\n';
    }, this);
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
            //murmures.serverLog('Response compressed');
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
    } else if (request.url === '/') {
        response.writeHead(301, { 'Location': '/src/pages/crawler.html' });
        response.end();
    } else if (request.url === '/allCore.js') {
        compressAndSend(request, response, 'application/javascript', murmures.coreScripts);
    } else if (request.url === '/allClient.js') {
        compressAndSend(request, response, 'application/javascript', murmures.clientScripts);
    } else if (request.url.startsWith('/src/')) {
        // #region Static Pages
        try {
            let fileName = request.url;
            fs.readFile('.' + fileName, function (err, fileContent) {
                if (err) {
                    murmures.serverLog('Requested file not found:' + JSON.stringify({ err: err, requrl: fileName }));
                    response.writeHead(400); // Bad Request
                    response.end();
                } else if (fileName.endsWith('.js')) {
                    compressAndSend(request, response, 'application/javascript', fileContent.toString());
                } else if (fileName.endsWith('.css')) {
                    compressAndSend(request, response, 'text/css', fileContent.toString());
                } else if (fileName.endsWith('.png')) {
                    compressAndSend(request, response, 'image/png', fileContent);
                } else if (fileName.endsWith('.html')) {
                    compressAndSend(request, response, 'text/html', fileContent.toString());
                } else {
                    response.writeHead(400); // Bad Request
                    response.end();
                }
            });
        } catch (e) {
            response.writeHead(404);
            response.end();
        }
        // #endregion
    } else {
        response.writeHead(404);
        response.end();
    }
}).listen(process.env.PORT || 15881);

var wss = new WebSocketServer({ server: server });
wss.on('connection', function (ws) {
    ws.on('message', function (messageTxt) {
        const message = JSON.parse(messageTxt);
        if (message.service === 'registerServerLog') {
            serverLoggers.push(ws);
            murmures.serverLog('New server logger registered');
        } else if (message.service === 'getLevel') {
            ws.send(JSON.stringify({ fn: 'init', payload: gameEngine }));
        } else if (message.service === 'order') {
            murmures.serverLog('Request received');
            let clientOrder = new murmures.Order();
            let parsing = clientOrder.build(message.payload);
            if (parsing.valid) {
                let check = gameEngine.checkOrder(clientOrder);
                if (check.valid) {
                    //gameEngine.gameTurn++;
                    //murmures.serverLog('Order checked');
                    let beforeState = gameEngine.clone(); // TODO : clone AFTER the turn for better performances.
                    const activation1 = new murmures.Activation();
                    const sourceCharacter = clientOrder.source;
                    activation1.build({
                        startTick : gameEngine.timeline.time,
                        endTick : gameEngine.timeline.time + sourceCharacter.skills[sourceCharacter.activeSkill].activation,
                        remainingWork : 0,
                        order : clientOrder
                    });
                    gameEngine.timeline.enqueue(activation1);
                    gameEngine.timeline.tick();
                    
                    let ge = gameEngine.compare(beforeState);
                    let res = JSON.stringify({ fn: 'o', payload: ge });
                    
                    // broadcast to all clients
                    wss.clients.forEach(function (client) {
                        client.send(res);
                    });
                    // cleaning
                    gameEngine.reportQueue = [];
                } else {
                    ws.send(JSON.stringify({ fn: 'o', payload: { error: check.reason } }));
                }
            } else {
                ws.send(JSON.stringify({ fn: 'o', payload: { error: parsing.reason } }));
            }
            murmures.serverLog('Response sent');
        } else if (message.service === 'restart') {
            murmures.restartGame(message.payload);
            wss.clients.forEach(function (client) {
                client.send(JSON.stringify({ fn: 'init', payload: gameEngine }));
            });
        } else if (message.service === 'test') {
            const test = new murmures.ServerTest();
            test.run(require);
        } else if (message.service === 'consistencyCheck') {
            const clientGe = message.payload;
            const diff = gameEngine.compare(clientGe);
            if (typeof diff === 'undefined') {
                //murmures.serverLog('Consistency Check OK');
            } else {
                murmures.serverLog('Consistency Check KO');
                murmures.serverLog(JSON.stringify({ diff: diff }));
                fs.writeFileSync('./log/diff', JSON.stringify({diff: diff, client: clientGe, server: gameEngine }));
            }
        } else {
            murmures.serverLog('Received an incorrect message from WS:' + messageTxt.toString());
        }
    });
});

murmures.serverLog('Listening on http://127.0.0.1:' + (process.env.PORT || 15881).toString() + '/');
