var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
var wsServer = new WebSocketServer({
    httpServer: server
});

// Starting values.
var clients = {};
var playerID = -1;
var playerSize = 10;
var playerSpeed = 1;
var playerMaxHP = 3;

var boardWidth = 500;
var boardHeight = 500;

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    
    var requestIndex = ++playerID;
    clients[requestIndex] = connection;

	var position = _getRandomPosition();
    var connectionData = {
    	type: "connectsuccess",
        player: {
            id: requestIndex,
            x: position.x,
            y: position.y,
            orientation: position.orientation,
            color: _getRandomColor(),
            size: playerSize,
            speed: playerSpeed,
            maxHP: playerMaxHP
        }
    };

    // Send initializion message.
    connection.sendUTF(JSON.stringify( connectionData ));

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            delete(clients[requestIndex]);
            console.log("Player " + requestIndex + " logged out.");
    });
});

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _getRandomPosition() {
    // Change 200 to boardLeft + 1/2 of tank size
    var x = (Math.floor(Math.random()*40) + 40) * playerSpeed;
    var y = (Math.floor(Math.random()*40) + 40) * playerSpeed;
    var o = _getRandomOrientation();
    return {x: x, y: y, orientation: o};
}

function _getRandomColor() {
    return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
}

function _getRandomOrientation() {
    var orientations = ["U", "D", "L", "R"];
    return orientations[Math.floor(Math.random()*orientations.length)];
}