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
sim.onCalculateWorldState(function(snapshot) {
    var snapshotMessage = {};
    snapshotMessage.type = "snapshot";
    snapshotMessage.timestamp = new Date().getTime();
    snapshotMessage.data = {
        timestamp: snapshotMessage.timestamp,
        snapshot: snapshot
    };
    _updateClients(snapshotMessage);
});
sim.startSimulation();

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    
    var playerID = ++newPlayerID;
    clients[playerID] = connection;
    console.log("Player " + playerID + " logged into the game server.");
    sim.addNewPlayer(playerID);
    
    var connectionData = {
    	type: "connectsuccess",
        id: playerID
    };

    // Send initialization message.
    connection.sendUTF(JSON.stringify( connectionData ));

    connection.on('message', function(data) {
        if (data.type === 'utf8') {
            var message = JSON.parse(data.utf8Data);
            if(message.type === "key") {
                sim.key(message.data);
            }
        }
    });

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            delete(clients[playerID]);
            sim.removePlayer(playerID);
            console.log("Player " + playerID + " logged out of the game server.");
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