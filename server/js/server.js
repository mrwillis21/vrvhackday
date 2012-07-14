"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');

var messages = []
var clients = []

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
var wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    
    var index = clients.push(connection) - 1;
    var userName = false;
    
    // send back chat history
    if (messages.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'messages', data: messages} ));
    }

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            userName = request.origin;
            // process WebSocket message
            var obj = {
                time: (new Date()).getTime(),
                text: htmlEntities(message.utf8Data),
                author: userName
            }
            messages.push(obj);
            messages = messages.slice(-100);
            
            var json = JSON.stringify({ type: 'message', data: obj });
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            }
        }
    });

    connection.on('close', function(connection) {
        // close user connection
        if (userName !== false) {
            // remove user from the list of connected clients
            clients.splice(index, 1);
        }
    });
});