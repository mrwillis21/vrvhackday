
var playerSize = 10;
var playerSpeed = 70;
var playerMaxHP = 3;

var players = {};
var keyQ = {}
var isSimulationRunning = false;

var Player = require("./player");

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
}

exports.removePlayer = function(id) {
    console.log("Removing player " + id + " from simulation.");
    delete(players[id]);
}

exports.key = function(playerID, timestamp, keyCode, direction) {
    if(!keyQ[playerID]) {
        keyQ[playerID] = [];
    }
    var queue = keyQ[playerID];
    var lastInput = queue[queue.length-1];
    if(!lastInput || (lastInput.keyCode != keyCode && lastInput.direction != direction)) {
        keyQ[playerID].push({timestamp: timestamp, keyCode: keyCode, direction: direction});
    }
}



exports.onCalculateWorldState = function(callback) {
    calculate_callback = callback;
}

// Tick on a 100ms heartbeat.
var _tick = function() {
    _calculateWorldState();
    if(isSimulationRunning) {
        setTimeout(_tick, 100);
    }
}

// FIXME
var _calculateWorldState = function() {
    var now = new Date().getTime();
    for(var playerID in players) {
        var player = players[playerID];
        var x = player.x;
        var y = player.y;
        var orientation = player.orientation;

        // TODO: handle keyUPs as well for stopping. However, ignore them if the previous keydown doesn't match.
        pkq = keyQ[playerID];
        if(pkq) {
            for(var i = 0; i < pkq.length; ++i) {
                var key = pkq[i];
                var dir = key.direction;
                var nextTimeStamp = now;
                if(pkq[i+1]) {
                    nextTimeStamp = pkq[i+1].timestamp;
                }
                if(dir === "down") {
                    var distance = player.speed * ((nextTimeStamp - pkq[i].timestamp)/1000);
                    _movePlayer(player, key.keyCode, distance); // TODO: Change this to a more multi-purpose function.
                }
                else if(dir === "up") {

                }
            }
            delete(keyQ[playerID]);
        }
    }

    // TODO: Calculate world snapshot
    var snapshot = {};
    snapshot.players = players;
    if(calculate_callback) {
        calculate_callback(snapshot);
    }
}

// Helper functions

var _movePlayer = function(player, keyCode, distance) {
    // TODO: Orientation
    if(keyCode === 37) {
        // LEFT
        player.x = player.x - distance;
    }
    else if(keyCode === 38) {
        // UP
        player.y = player.y - distance;
    }
    else if(keyCode === 39) {
        // RIGHT
        player.x = player.x + distance; 
    }
    else if(keyCode === 40) {
        // DOWN
        player.y = player.y + distance;
    }
}

var _getRandomPosition = function() {
    // Change 200 to boardLeft + 1/2 of tank size
    var x = (Math.floor(Math.random()*40) + 40);
    var y = (Math.floor(Math.random()*40) + 40);
    var o = _getRandomOrientation();
    return {x: x, y: y, orientation: o};
}

var _getRandomColor = function() {
    return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
}

var _getRandomOrientation = function() {
    var orientations = ["U", "D", "L", "R"];
    return orientations[Math.floor(Math.random()*orientations.length)];
}