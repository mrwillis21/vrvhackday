"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');

var nextId = -1;
var clients = [];
var bulletTimers = [];
var bulletTimerIndex = 0;

var boardWidth = 500;
var boardHeight = 500;
var boardColor = "#FFFFFF";
var maxPlayers = 10;
var moveIncrement = 5;

var boardState = new BoardState();

function BoardInitializer(width, height, backgroundColor, moveIncrement) {
    this.width = width,
    this.height = height,
    this["background-color"] = backgroundColor,
    this["move-increment"] = moveIncrement;
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
    this.orientation = orientation,
    this.width = 10,
    this.height = 10
}

function Position(x, y, o) {
    this.x = x,
    this.y = y,
    this.o = o
}

function Bullet(playerId, position) {
    this.playerId = playerId,
    this.position = position
    this.width = 2,
    this.height = 2
}

function BoardState() {
    this.type = "update",
    this.players = [],
    this.bullets = []
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
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;

    nextId+=1;
    var player = new Player(nextId, _getRandomColor(), _getRandomPosition(), _getRandomOrientation());
    boardState.players.push(player);

    console.log((new Date()) + ' Connection from origin ' + request.origin + '. Assigning ID: ' + nextId);

    var boardInit = new BoardInitializer(boardWidth, boardHeight, boardColor, moveIncrement);
    var connectionData = new Connector(nextId, boardInit);
    
    // Send initializion message.
    connection.sendUTF(JSON.stringify( connectionData ));

    // Update board state for all players.
    _updateClients();

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            var json = JSON.parse(message.utf8Data);
            if(json.type === "move") {
                var player = _getPlayerByID(json.id);
                if(player) {
                    var newX = json["new-pos"].x
                    var newY = json["new-pos"].y
                    if(_isValidMove(player, newX, newY)) {
                        player.position.x = newX;
                        player.position.y = newY;
                        player.position.o = json["new-pos"].o;
                    }
                }
            }
            else if(json.type === "fire") {
                var player = _getPlayerByID(json.id);
                if(player) {
                    var posX = player.position.x;
                    var posY = player.position.y;
                    var o = player.position.o;

                    var bullet = new Bullet(player.id, {"x" : posX, "y" : posY});
                    var bulletIndex = boardState.bullets.push(bullet);

                    var timer = setInterval(function() {
                        console.log("Moving bullet " + json.id);
                        bullet.position.x = bullet.position.x - moveIncrement;
                        _updateClients();
                        if (bullet.position.x < 0) {
                            clearInterval(timer);
                        }
                    }, 100);
                }
            }
            _updateClients();
        }
    });

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            clients.splice(index, 1);
            boardState.players.splice(index, 1);
            console.log("Player " + nextId + " logged out.");
            _updateClients();
    });

    function _updateClients() {
        for(var i = 0; i < clients.length; ++i) {
            if(clients[i]) {
                clients[i].sendUTF(JSON.stringify( boardState ));
            }
        }
    }

    function _getRandomPosition() {
        // Change 200 to boardLeft + 1/2 of tank size
        var x = (Math.floor(Math.random()*40) + 40) * moveIncrement;
        var y = (Math.floor(Math.random()*40) + 40) * moveIncrement;
        var o = _getRandomOrientation();
        return new Position(x, y, o);
    }

    function _getRandomColor() {
        return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
    }

    function _getRandomOrientation() {
        var orientations = ["U", "D", "L", "R"];
        return orientations[Math.floor(Math.random()*orientations.length)];
    }

    // collision detection/bounds control
    function _isValidMove(player, newX, newY) {
        var players = boardState.players;
        for(var i = 0; i < players.length; i++) {
            var otherPlayer = players[i];
            // Make sure I'm not comparing myself to... myself.
            if(otherPlayer.id != player.id) {
                if(Math.abs(otherPlayer.position.x - newX) <= 5 && Math.abs(otherPlayer.position.y - newY) <= 5) { // Fix magic numbers - what about different sized tanks?
                    return false;
                }
            }
            if(newX +)
        }
        return true;
    }

    function _getPlayerByID(id) {
        for(var i = 0; i < boardState.players.length; i++) {
            if(boardState.players[i].id === id) {
                return boardState.players[i];
            }
        }
    }
});