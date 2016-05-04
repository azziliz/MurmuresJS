'use strict';

var murmures = require('./src/murmures');
var gameEngine = null;
//var phy = new murmures.physicalGround();
//var txt = JSON.stringify(phy);

require('http').createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(require('fs').readFileSync('client.html').toString());

        gameEngine = new murmures.gameEngine();
        gameEngine.tileSize = 32;

        gameEngine.hero = new murmures.character();
        let hero1Txt = require('fs').readFileSync('./data/hero1.json', 'utf8').toString().replace(/^\uFEFF/, '');
        gameEngine.hero.fromJson(JSON.parse(hero1Txt));

        gameEngine.level = new murmures.level();
        let level1Txt = require('fs').readFileSync('./data/level3.json', 'utf8').toString().replace(/^\uFEFF/, '');
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
                response.writeHead(200, { 'Content-Type': 'application/javascript' });
                response.end(fileContent.toString());
            }
            else if (fileName.endsWith('.css')) {
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(fileContent.toString());
            }
            else if (fileName.endsWith('.png')) {
                response.writeHead(200, { 'Content-Type': 'image/png' });
                response.end(fileContent);
            }
            else if (fileName.endsWith('.html')) {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(fileContent.toString());
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
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(gameEngine));
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
                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify(gameEngine));
                    }
                    else {
                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ error: check.reason }));
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
