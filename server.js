'use strict';

var murmures = require('./src/murmures');
var playerConnected = null;
require('http').createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(require('fs').readFileSync('client.html').toString());
        playerConnected = new murmures.player();
        playerConnected.character = new murmures.character();
        //console.log(playerConnected);
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
                    let level1Txt = require('fs').readFileSync('./data/level1.json', 'utf8').toString().replace(/^\uFEFF/, '');
                    let level1 = new murmures.level();
                    level1.fromJson(JSON.parse(level1Txt));                    
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(level1));
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

let firstHero = new murmures.character();
murmures.log('A hero has ' + firstHero.hitPoints + ' hit points by default.');
let levelX = new murmures.level();
