
var playerSize = 10;
var playerSpeed = 70;
var playerMaxHP = 3;

var players = {};
var isSimulationRunning = false;
var lastKeyPress = {};

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

exports.key = function(keyPress) {
    var lastKey = lastKeyPress[keyPress.id];
    if(!lastKey || lastKey.keyCode != keyPress.keyCode || lastKey.direction != keyPress.direction) {
        var player = players[keyPress.id];
        if(lastKey) {
            if(lastKey.direction === "down") {
                var distance = player.speed * ((keyPress.timestamp - lastKey.timestamp) / 1000);
                player.move(distance);
            }
        }

        if(keyPress.direction === "up") {
            player.stopMoving(keyPress.keyCode);
        }
        else if(keyPress.direction === "down") {
            player.startMoving(keyPress.keyCode);
        }

        lastKeyPress[keyPress.id] = keyPress;
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
    for(var playerID in players) {
        var lastKey = lastKeyPress[playerID];
        var player = players[playerID];
        if(lastKey) {
            if(lastKey.direction === "down") {
                var distance = player.speed * ((new Date().getTime() - lastKey.timestamp) / 1000);
                player.move(distance);
            }
        }
    }

    var snapshot = {};
    snapshot.players = players;
    if(calculate_callback) {
        calculate_callback(snapshot);
    }
}

// Helper functions

var _getRandomPosition = function() {
    // Change 200 to boardLeft + 1/2 of tank size
    var x = (Math.floor(Math.random()*400));
    var y = (Math.floor(Math.random()*400));
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