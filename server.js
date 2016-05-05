'use strict';

var murmures = require('./src/murmures');
var gameEngine = null;

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

        gameEngine = new murmures.gameEngine();
        gameEngine.tileSize = 32;
        
        let bodiesJson = require('fs').readFileSync('./data/bodies.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.bodies = JSON.parse(bodiesJson);
        //var txt = JSON.stringify(gameEngine.bodies);
        
        let mobsJson = require('fs').readFileSync('./data/mobs.json', 'utf8').toString().replace(/^\uFEFF/, '');
        let mobsReference = JSON.parse(mobsJson).templates;
        gameEngine.mobsReference = {};
        mobsReference.forEach(function (mob) { gameEngine.mobsReference[mob.uniqueId] = mob; });
        
        gameEngine.hero = new murmures.character();
        let hero1Txt = require('fs').readFileSync('./data/hero1.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.hero.fromJson(JSON.parse(hero1Txt));

        gameEngine.level = new murmures.level();
        let level1Txt = require('fs').readFileSync('./data/level2.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.level.fromJson(JSON.parse(level1Txt),murmures);
        gameEngine.hero.position = gameEngine.level.startingTile;

        gameEngine.loadMobs(murmures);

    }
    else if (request.url.startsWith('/src/')) {
        // #region Static Pages
        try {
            let fileName = request.url;
            let fileContent = require('fs').readFileSync('.'.concat(fileName));
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
                    let check = gameEngine.checkOrder(postData);
                    if (check.valid) {
                        gameEngine.applyOrder(postData);
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

murmures.log('Server running at http://127.0.0.1:15881/');
