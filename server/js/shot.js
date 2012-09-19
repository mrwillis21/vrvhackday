var Enums = require("../../shared/js/enums");

var nextShotID = -1;

var Shot = function(playerID) {
	this.id = Shot.getNextShotID();
	this.playerID = playerID;
	this.size = 2;
	this.damage = 1;
	this.x = 0;
	this.y = 0;
	this.orientation;
	this.speed = 1;
}

Shot.prototype.setPosition = function(x, y) {
	this.x = x;
	this.y = y;
}

Shot.prototype.setDamage = function(damage) {
	this.damage = damage;
}

Shot.prototype.setOrientation = function(orientation) {
	this.orientation = orientation;
}

Shot.prototype.setSpeed = function(speed) {
	this.speed = speed;
}

Shot.prototype.move = function(timeElapsed) {
	var distance = this.speed * (timeElapsed / 1000);
	if(this.orientation === Enums.Orientations.UP) {
		this.y = this.y-distance;
	}
	else if(this.orientation === Enums.Orientations.DOWN) {
		this.y = this.y+distance;
	}
	else if(this.orientation === Enums.Orientations.LEFT) {
		this.x = this.x-distance;
	}
	else if(this.orientation === Enums.Orientations.RIGHT) {
		this.x = this.x+distance;
	}
}

Shot.getNextShotID = function() {
	return ++nextShotID;
}

// Expose the class to Node.js
module.exports = Shot;