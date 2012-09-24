
var isSimulationRunning = false;
var tickInterval = 100;

var playerSize = 10;
var playerSpeed = 70;
var playerMaxHP = 3;
var boardSize = 500;

var players = {};
var shots = {};
var deathTimers = {};

var lastWorldSnapshot = {};
var moveBuffers = {};

var Enums = require("../../shared/js/enums");
var Player = require("./player");
var Shot = require("./shot");

exports.startSimulation = function() {
    isSimulationRunning = true;
    _tick();
}

exports.stopSimulation = function() {
    isSimulationRunning = false;
}

exports.addNewPlayer = function(id) {
    console.log("Adding player " + id + " to simulation.");
    var position = _getRandomPosition();
    var player = new Player(id);
    player.setPosition(position.x, position.y, position.orientation);
    player.setColor(_getRandomColor());
    player.setSize(playerSize);
    player.setSpeed(playerSpeed);
    player.setMaxHP(playerMaxHP);

    players[id] = player;
    moveBuffers[id] = [];
}

exports.removePlayer = function(id) {
    console.log("Removing player " + id + " from simulation.");
    delete(players[id]);
    delete(moveBuffers[id]);
    // Delete any shots fired by said player.
    for(shotID in shots) {
        if(shots[shotID].playerID == id) {
            delete(shots[shotID]);
        }
    }
}

exports.keyPress = function(keyPress) {
}

exports.keyUp = function(keyPress) {
    if(keyPress.keyCode == Enums.Orientations.UP ||
        keyPress.keyCode == Enums.Orientations.DOWN ||
        keyPress.keyCode == Enums.Orientations.LEFT ||
        keyPress.keyCode == Enums.Orientations.RIGHT) {

        var playerID = keyPress.id;

        var player = players[playerID];
        var moveBuffer = moveBuffers[playerID];
        if(player && moveBuffer) { // If not, something's gone off the rails.
            var lastKeyPress = moveBuffer[moveBuffer.length - 1]; // FIXME: Could return undefined.
            _movePlayer(keyPress, lastKeyPress);
            player.stopMoving(keyPress.keyCode);
            for(var i = moveBuffer.length - 1; i >= 0; i--) {
                if(moveBuffer[i].keyCode == keyPress.keyCode) {
                    moveBuffer.splice(i, 1);
                }
            }
            if(moveBuffer.length > 0) {
                var lastKeyPress = moveBuffer[moveBuffer.length - 1];
                lastKeyPress.timestamp = new Date().getTime();
                player.startMoving(lastKeyPress.keyCode);
            }
        }
    }
    else if(keyPress.keyCode == 32) {
        var playerID = keyPress.id;
        var player = players[playerID];
        if(player) {
            player.shotLock = false;
        }
    }
}

exports.keyDown = function(keyPress) {
    if(keyPress.keyCode == Enums.Orientations.UP ||
        keyPress.keyCode == Enums.Orientations.DOWN ||
        keyPress.keyCode == Enums.Orientations.LEFT ||
        keyPress.keyCode == Enums.Orientations.RIGHT) {

        var playerID = keyPress.id;

        var player = players[playerID];
        var moveBuffer = moveBuffers[playerID];
        if(player && moveBuffer) { // If not, something's gone off the rails.
            var lastKeyPress = moveBuffer[moveBuffer.length - 1]; // FIXME: Could return undefined.
            _movePlayer(keyPress, lastKeyPress);
            player.startMoving(keyPress.keyCode);
            // Add the movement to the move buffer. FIXME: This will add auto-repeat presses as well.
            moveBuffer.push(keyPress);
        }
    }
    else if(keyPress.keyCode == 13 && keyPress.name) {
        _setPlayerName(keyPress);
    }
    else if(keyPress.keyCode == 32) {
        _fireBullet(keyPress);
    }
}

exports.onCalculateWorldState = function(callback) {
    calculate_callback = callback;
}

// Tick on a 100ms heartbeat.
var _tick = function() {
    _calculateWorldState();
    if(isSimulationRunning) {
        setTimeout(_tick, tickInterval);
    }
}

// FIXME
var _calculateWorldState = function() {
    for(var playerID in players) {
        var player = players[playerID];
        if(deathTimers[playerID] && (new Date().getTime() > (deathTimers[playerID] + player.respawnDelay))) {
            player.alive = true;
            delete(deathTimers[playerID]);
        }
        var moveBuffer = moveBuffers[playerID];
        var lastKeyPress = moveBuffer[moveBuffer.length - 1];
        if(lastKeyPress) {
            var now = new Date().getTime();
            var distance = player.speed * ((now - lastKeyPress.timestamp) / 1000);
            var distanceToWall = _getDistanceToWall(player);
            if(distanceToWall < distance) {
                distance = distanceToWall;
            }
            player.move(distance);
            lastKeyPress.timestamp = now;
        }
    }

    for(var shotID in shots) {
        var shot = shots[shotID];
        shot.move(tickInterval);
        _checkForBulletCollisions(shot);
        // Remove shots that have traveled off the board.
        if(shot.x < 0 || shot.x > boardSize || shot.y < 0 || shot.y > boardSize) {
            delete(shots[shotID]);
        }
    }

    var snapshot = {};
    snapshot.players = players;
    snapshot.shots = shots;

    // FIXME: This is a terrible way to make a clone, but it'll do for now.
    lastWorldSnapshot = JSON.parse(JSON.stringify(snapshot));
    if(calculate_callback) {
        calculate_callback(snapshot);
    }
}

// Helper functions

var _getRandomPosition = function() {
    var x = (Math.floor(Math.random()*400)+playerSize);
    var y = (Math.floor(Math.random()*400)+playerSize);
    var o = _getRandomOrientation();
    return {x: x, y: y, orientation: o};
}

var _getRandomColor = function() {
    return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
}

var _getRandomOrientation = function() {
    return Math.floor(Math.random()*4)+37;
}

var _movePlayer = function(keyPress, lastKeyPress) {
    var player = players[keyPress.id];
    if(keyPress && lastKeyPress && player.moving) {
        var distance = player.speed * ((keyPress.timestamp - lastKeyPress.timestamp) / 1000);
        var distanceToWall = _getDistanceToWall(player);
        if(distanceToWall < distance) {
            distance = distanceToWall;
        }
        player.move(distance);
    }
}

var _getDistanceToWall = function(player) {
    var orientation = player.orientation;
    if(orientation === 38) {
        return player.y - player.size;
    }
    else if(orientation === 40) {
        return boardSize - player.y - player.size; // FIXME - we need to standardize on board size.
    }
    else if(orientation === 37) {
        return player.x - player.size;
    }
    else if(orientation === 39) {
        return boardSize - player.x - player.size; // FIXME - we need to standardize on board size.
    }
}

var _fireBullet = function(keyPress) {
    var now = new Date().getTime();
    var player = players[keyPress.id];
    if(!player.shotLock && now - player.lastShotTime > player.shotDelay) {
        player.lastShotTime = now;
        var shot = new Shot(player.id);
        shot.setPosition(player.x, player.y);
        shot.setOrientation(player.orientation);
        shot.setSpeed(200); // TODO: Determine speed based on bullet type.
        shots[shot.id] = shot;
        player.shotLock = true;
    }
}

var _checkForBulletCollisions = function(shot) {
    for(playerID in players) {
        if(shot.playerID == playerID) {
            continue; // Can't self-harm. :)
        }
        if(_checkForBulletCollisionWithPlayer(playerID, shot)) {
            return true;
        }        
    }
    return false;
}

var _checkForBulletCollisionWithPlayer = function(playerID, shot) {
    var playerThen = lastWorldSnapshot.players[playerID];
    var player = players[playerID];
    var shotThen = lastWorldSnapshot.shots[shot.id];

    // FIXME: If the players are too close together, this won't work.
    if(playerThen && shotThen) {
        for(var i = 0.1; i <= 1; i = i + 0.1) {
            var playerX = playerThen.x + ((player.x - playerThen.x) * i);
            var playerY = playerThen.y + ((player.y - playerThen.y) * i);
            var shotX = shotThen.x + ((shot.x - shotThen.x) * i);
            var shotY = shotThen.y + ((shot.y - shotThen.y) * i);

            var halfPlayerSize = player.size/2;
            var playerLeft = playerX - halfPlayerSize;
            var playerTop = playerY - halfPlayerSize;
            var playerRight = playerX + halfPlayerSize;
            var playerBottom = playerY + halfPlayerSize;

            var halfShotSize = shot.size/2;
            var shotLeft = shotX - halfShotSize;
            var shotTop = shotY - halfShotSize;
            var shotRight = shotX + halfShotSize;
            var shotBottom = shotY + halfShotSize;

            if(!(shotBottom < playerTop || shotTop > playerBottom || shotLeft > playerRight || shotRight < playerLeft)) {
                _damagePlayer(player, shot);
                return true;
            }
        }
    }
}

var _damagePlayer = function(player, shot) {
    player.currentHP = player.currentHP - shot.damage;
    if(player.currentHP <= 0) {
        deathTimers[player.id] = new Date().getTime();
        player.alive = false;
        player.currentHP = player.maxHP;
        var pos = _getRandomPosition();
        player.setPosition(pos.x, pos.y, pos.orientation);
        players[shot.playerID].score++;
    }
    delete(shots[shot.id]);
}

var _setPlayerName = function(keyPress) {
    var player = players[keyPress.id];
    if(keyPress.name) {
        // Naive XSS check.
        if(keyPress.name.indexOf("<") == -1 && keyPress.name.indexOf(">") == -1) {
            player.setName(keyPress.name);
        }
    }
}