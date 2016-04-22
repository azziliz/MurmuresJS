'use strict';

var murmures = require('./src/murmures');

require('http').createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(require('fs').readFileSync('client.html').toString());
    }
    else {
        let buffer = "";
        request.on('data', function (chunk) {
            buffer = buffer.concat(chunk.toString());
            if (buffer.length > 1e6) request.connection.destroy(); // Prevent buffer overflow attacks
        });
        request.on('end', function () {
            if (request.url === '/helloworld') {
                let postData = JSON.parse(buffer);
                if (postData === null) {
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Wrong request.' }));
                }
                else {
                    response.writeHead(200, { 'Content-Type': 'text/plain' });
                    setTimeout(function () {response.end('XHR successfully received and parsed by server. Hello client.');}, 2000);	// Simulate 2 seconds delay
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
let level1 = JSON.parse(require('fs').readFileSync('./data/level1.json', 'utf8').toString().replace(/^\uFEFF/, ''));
