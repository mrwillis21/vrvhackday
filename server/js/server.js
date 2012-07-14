"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');

var nextId = -1;
var clients = {};

var boardWidth = 500;
var boardHeight = 500;
var boardColor = "#FFFFFF";
var maxPlayers = 10;
var moveIncrement = 5;
var playerWidth = 10;
var playerHeight = 10;

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
    this.width = playerWidth,
    this.height = playerHeight,
    this.score = 0;
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
    this.players = {},
    this.bullets = {}
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
    
    var requestIndex = ++nextId;
    clients[requestIndex] = connection;

    var player = new Player(requestIndex, _getRandomColor(), _getRandomPosition(), _getRandomOrientation());
    boardState.players[requestIndex] = player;

    console.log((new Date()) + ' Connection from origin ' + request.origin + '. Assigning ID: ' + requestIndex);

    var boardInit = new BoardInitializer(boardWidth, boardHeight, boardColor, moveIncrement);
    var connectionData = new Connector(requestIndex, boardInit);

    // Send initializion message.
    connection.sendUTF(JSON.stringify( connectionData ));

    // Update board state for all players.
    _updateClients();

    var nextBulletId = -1;

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            var json = JSON.parse(message.utf8Data);
            if(json.type === "move") {
                var player = boardState.players[json.id];
                if(player) {
                    var newX = json["new-pos"].x
                    var newY = json["new-pos"].y
                    if(_isValidMove(player, newX, newY)) {
                        player.position.x = newX;
                        player.position.y = newY;
                    }
                    player.position.o = json["new-pos"].o;
                }
            }
            else if(json.type === "fire") {
                var player = boardState.players[json.id];
                if(player) {
                    var posX, posY;
                    var o = player.position.o;

                    if(o === "L") {
                        posX = player.position.x - playerWidth;
                        posY = player.position.y;
                    }
                    else if(o === "R") {
                        posX = player.position.x + playerWidth;
                        posY = player.position.y;
                    }
                    else if(o === "U") {
                        posX = player.position.x;
                        posY = player.position.y - playerHeight;
                    }
                    else if(o === "D") {
                        posX = player.position.x;
                        posY = player.position.y + playerHeight;
                    }

                    nextBulletId++;
                    var bullet = new Bullet(player.id, {"x" : posX, "y" : posY});
                    boardState.bullets[nextBulletId] = bullet;
                    
                    var timer = setInterval(function() {
                        if(o === "L") {
                            bullet.position.x = bullet.position.x - moveIncrement;
                        }
                        else if(o === "R") {
                            bullet.position.x = bullet.position.x + moveIncrement;
                        }
                        else if(o === "U") {
                            bullet.position.y = bullet.position.y - moveIncrement;
                        }
                        else if(o === "D") {
                            bullet.position.y = bullet.position.y + moveIncrement;
                        }
                        if (_isBulletOutOfBounds(bullet) || _isBulletHitSomeone(bullet)) {
                            clearInterval(timer);
                            delete(boardState.bullets[nextBulletId]);
                        }
                        _updateClients();
                    }, 50);
                }
            }
            _updateClients();
        }
    });

    connection.on('close', function(connection) {
            // remove user from the list of connected clients
            delete(clients[requestIndex]);
            delete(boardState.players[requestIndex]);
            console.log("Player " + requestIndex + " logged out.");
            _updateClients();
    });

    function _updateClients() {
        for(var key in clients) {
            if(clients[key]) {
                console.log(boardState);
                clients[key].sendUTF(JSON.stringify( boardState ));
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
        for(var playerId in players) {
            var otherPlayer = players[playerId];
            // Make sure I'm not comparing myself to... myself.
            if(otherPlayer.id != player.id) {
                if(Math.abs(otherPlayer.position.x - newX) <= 5 && Math.abs(otherPlayer.position.y - newY) <= 5) { // Fix magic numbers - what about different sized tanks?
                    return false;
                }
            }
            if(newX - 5 < 0 || newY - 5 < 0 || newX + 5 > boardInit.width || newY + 5 > boardInit.height) {
                return false;
            }
        }
        return true;
    }

    function _isBulletOutOfBounds(bullet) {
        return bullet.position.x < 0 || bullet.position.x > boardInit.width || bullet.position.y < 0 || bullet.position.y > boardInit.height
    }

    function _isBulletHitSomeone(bullet) {
        var players = boardState.players;
        for(var key in players) {
            if(bullet.playerId !== players[key].id) {
                if(Math.abs(bullet.position.x - players[key].position.x) <= 5 && Math.abs(bullet.position.y - players[key].position.y) <= 5) { // Fix magic numbers - what about different sized tanks?
                    // Increment shooter's score.
                    var shooter = players[bullet.playerId];
                    if(shooter) {
                        shooter.score++;
                    }
                    // Reset person who got hit.
                    players[key].position = _getRandomPosition();
                    return true;
                }
            }
        }
        return false;
    }
});