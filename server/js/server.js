"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');

var nextId = -1;
var clients = [];

var boardWidth = 500;
var boardHeight = 500;
var boardColor = "#FFFFFF";
var maxPlayers = 10;

var boardState = new BoardState();

function BoardInitializer(width, height, backgroundColor, maxPlayers) {
    this.width = width,
    this.height = height,
    this["background-color"] = backgroundColor,
    this["max-players"] = maxPlayers
}

function Connector(id, boardInitializer) {
    this.type = "connectsuccess",
    this.yourid = id,
    this.board = boardInitializer
}

function Player(id, color, position, orientation) {
    this.id = id,
    this.color = color,
    this.position = position,
    this.orientation = orientation
}

function Position(x, y, o) {
    this.x = x,
    this.y = y,
    this.o = o
}

function BoardState() {
    this.type = "update",
    this.players = []
}

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

    var player = new Player(index, _getRandomColor(), _getRandomPosition(), _getRandomOrientation());
    boardState.players.push(player);

    var boardInit = new BoardInitializer(boardWidth, boardHeight, boardColor, maxPlayers);
    var connectionData = new Connector(index, boardInit);
    
    // Send initializion message.
    connection.sendUTF(JSON.stringify( connectionData ));

    // Update board state for all players.
    _updateBoard();

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            /*userName = request.origin;
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
            }*/
        }
    });

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            clients[index] = null;
    });

    function _updateBoard() {    
        for(var i = 0; i < clients.length; ++i) {
            if(clients[i]) {
                clients[i].sendUTF(JSON.stringify( boardState ));
            }
        }
    }

    function _getRandomPosition() {
        // Change 200 to boardLeft + 1/2 of tank size
        var x = Math.floor(Math.random()*200) + 200;
        var y = Math.floor(Math.random()*200) + 200;
        var o = _getRandomOrientation();
        return new Position(x, y, o);
    }

    function _getRandomColor() {
        return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
    }

    function _getRandomOrientation() {
        var orientations = ["U", "D", "L", "R"];
        return orientations[Math.floor(Math.random()*5)];
    }
});