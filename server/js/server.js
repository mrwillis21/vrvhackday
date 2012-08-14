"use strict";

var WebSocketServer = require('websocket').server;
var http = require('http');

var nextId = -1;
var nextBulletId = -1;
var clients = {};

var boardWidth = 500;
var boardHeight = 500;
var boardColor = "#FFFFFF";
var maxPlayers = 10;
var moveIncrement = 5;
var playerWidth = 10;
var playerHeight = 10;
var playerHealth = 3;

var boardState = new BoardState();

function BoardInitializer(width, height, backgroundColor, moveIncrement) {
    this.width = width,
    this.height = height,
    this["background-color"] = backgroundColor,
    this["move-increment"] = moveIncrement;
    this.maxHealth = playerHealth;
}

function Connector(id, boardInitializer) {
    this.type = "connectsuccess",
    this.yourid = id,
    this.board = boardInitializer
}

function Player(id, name, color, position, orientation) {
    this.id = id,
    this.name = name;
    this.color = color,
    this.position = position,
    this.orientation = orientation,
    this.width = playerWidth,
    this.height = playerHeight,
    this.score = 0;
    this.hp = playerHealth;
}

function Position(x, y, o) {
    this.x = x,
    this.y = y,
    this.o = o
}

function Bullet(id, playerId, position, direction) {
    this.id = id;
    this.playerId = playerId,
    this.position = position,
    this.direction = direction,
    this.speed = 50, // Fix this later - allow for different types of bullets and things. Variable-speed bullets?
    this.width = 2,
    this.height = 2
}

function BoardState() {
    this.type = "update",
    this.players = {},
    this.bullets = {}
}

var gameTimer = setInterval(function() { _updateBullets(); _updateClients(); }, 500);

function _updateClients() {
    for(var key in clients) {
        if(clients[key]) {
            clients[key].sendUTF(JSON.stringify( boardState ));
        }
    }
}

function _updateBullets() {
    for(var id in boardState.bullets) {
        var bullet = boardState.bullets[id];
        var d = bullet.direction;
        if(d === "L") {
            bullet.position.x = bullet.position.x - bullet.speed;
        }
        else if(d === "R") {
            bullet.position.x = bullet.position.x + bullet.speed;
        }
        else if(d === "U") {
            bullet.position.y = bullet.position.y - bullet.speed;
        }
        else if(d === "D") {
            bullet.position.y = bullet.position.y + bullet.speed;
        }
        if (_isBulletOutOfBounds(bullet) || _isBulletHitSomeone(bullet)) {
            delete(boardState.bullets[bullet.id]);
        }
    }
}

function _isBulletOutOfBounds(bullet) {
    return bullet.position.x < 0 || bullet.position.x > boardWidth || bullet.position.y < 0 || bullet.position.y > boardHeight;
}

function _isBulletHitSomeone(bullet) {
    var players = boardState.players;
    for(var key in players) {
        if(bullet.playerId !== players[key].id) {
            if(Math.abs(bullet.position.x - players[key].position.x) <= 5 && Math.abs(bullet.position.y - players[key].position.y) <= 5) { // Fix magic numbers - what about different sized tanks?
                // Increment shooter's score.
                // Reset person who got hit.
                players[key].hp = players[key].hp - 1;
                
                if(players[key].hp === 0) {
                    var shooter = players[bullet.playerId];
                    if(shooter) {
                        shooter.score++;
                    }
                    players[key].hp = playerHealth;
                    players[key].position = _getRandomPosition();
                }
                return true;
            }
        }
    }
    return false;
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
        if(newX - 5 < 0 || newY - 5 < 0 || newX + 5 > boardWidth || newY + 5 > boardHeight) {
            return false;
        }
    }
    return true;
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

    var player = new Player(requestIndex, "New Player", _getRandomColor(), _getRandomPosition(), _getRandomOrientation());
    boardState.players[requestIndex] = player;

    console.log((new Date()) + ' Connection from origin ' + request.origin + '. Assigning ID: ' + requestIndex);

    var boardInit = new BoardInitializer(boardWidth, boardHeight, boardColor, moveIncrement);
    var connectionData = new Connector(requestIndex, boardInit);

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
                        posX = player.position.x - (playerWidth/2);
                        posY = player.position.y;
                    }
                    else if(o === "R") {
                        posX = player.position.x + (playerWidth/2);
                        posY = player.position.y;
                    }
                    else if(o === "U") {
                        posX = player.position.x;
                        posY = player.position.y - (playerHeight/2);
                    }
                    else if(o === "D") {
                        posX = player.position.x;
                        posY = player.position.y + (playerHeight/2);
                    }

                    ++nextBulletId;
                    var bullet = new Bullet(nextBulletId, player.id, {"x" : posX, "y" : posY}, o);
                    boardState.bullets[nextBulletId] = bullet;
                }
            }
            if(json.type === "changeusername") {
                var player = boardState.players[json.id];
                player.name = json.name;
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
});