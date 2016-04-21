"use strict";

function log(txt) {
    console.log(''.concat((new Date()).toISOString(), ' - ', txt));
}

require('http').createServer(function (request, response) {
    if (request.url === '/favicon.ico') {
        response.writeHead(204); // No content
        response.end();
    }
    else if (request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(require('fs').readFileSync('client.html'));
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
					setTimeout(function() {response.end("XHR successfully received and parsed by server. Hello client.");}, 2000);	// Simulate 2 seconds delay
                }
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }
}).listen(15881);

log('Server running at http://127.0.0.1:15881/');

