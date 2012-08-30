
var playerSize = 10;
var playerSpeed = 1;
var playerMaxHP = 3;

var players = {};
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
    console.log("Adding player " + id);
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
    console.log("Removing player " + id);
    delete(players[id]);
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

var _calculateWorldState = function() {
    // TODO: Calculate world snapshot
    var snapshot = {};
    if(calculate_callback) {
        calculate_callback(snapshot);
    }
}

// Helper functions

var _getRandomPosition = function() {
    // Change 200 to boardLeft + 1/2 of tank size
    var x = (Math.floor(Math.random()*40) + 40) * playerSpeed;
    var y = (Math.floor(Math.random()*40) + 40) * playerSpeed;
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