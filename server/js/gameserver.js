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

var clients = {};
var newPlayerID = -1;

var sim = require('./simulation');
sim.onCalculateWorldState(function() {
    console.log("Calculating world state from the server!");
});
sim.startSimulation();

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    
    var requestIndex = ++newPlayerID;
    clients[requestIndex] = connection;
    sim.addNewPlayer(requestIndex);
    
    var connectionData = {
    	type: "connectsuccess",
        id: requestIndex
    };

    // Send initialization message.
    connection.sendUTF(JSON.stringify( connectionData ));

    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            var message = JSON.parse(data.utf8Data);
            if(message.type === "keyDown") {
                console.log("Client " + message.data.id + " pressed key " + message.data.keyCode);
            }
            else if(message.type === "keyUp") {
                console.log("Client " + message.data.id + " released key " + message.data.keyCode);
            }
            /*if(data.type === "statechange") {
                var player = serverPlayers[data.player.id];
                if(player) {
                    player.id = data.player.id;
                    player.color = data.player.color;
                    player.x = data.player.x;
                    player.y = data.player.y;
                    player.orientation = data.player.orientation;
                    player.size = data.player.size;
                    player.speed = data.player.speed;
                    player.maxHP = data.player.maxHP;
                }
            }
            _updateClients({type: "update", players: serverPlayers}); // TODO: Fill out a full, proper boardState object.*/
        }
    });

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            delete(clients[requestIndex]);
            sim.removePlayer(requestIndex);
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

function _updateClients(object) {
    for(var id in clients) {
        if(clients[id]) {
            clients[id].sendUTF(JSON.stringify( object ));
        }
    }
}