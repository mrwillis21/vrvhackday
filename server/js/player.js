var Enums = require("../../shared/js/enums");

var Player = function(id) {
	this.id = id;
	this.name = "New Player";
	this.x = 0;
	this.y = 0;
	this.orientation = Enums.Orientations.UP;
	this.color = "#000000";
	this.size = 10;
	this.maxHP = 3;
	this.currentHP = 3;
	this.canFire = true;
	this.moving = false;
	this.speed = 1;
	this.score = 0;
	this.shotDelay = 400; // In milliseconds.
	this.lastShotTime = 0;
}

Player.prototype.setName = function(name) {
	this.name = name;
}

Player.prototype.setPosition = function(x, y, orientation) {
	this.x = x;
	this.y = y;
	this.orientation = orientation;
}

Player.prototype.setColor = function(color) {
	this.color = color;
}

Player.prototype.setSize = function(size) {
	// TODO: Check for int.
	this.size = size;
}

Player.prototype.setMaxHP = function(hp) {
	// TODO: Check for int.
	this.maxHP = hp;
}

Player.prototype.setSpeed = function(speed) {
	this.speed = speed;
}

Player.prototype.move = function(distance) {
	if(this.moving) {
		// TODO: Verify legal move before moving. Should the entity take care of this or the board manager?
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
}

Player.prototype.startMoving = function(orientation) {
	if(!this.moving || this.orientation != orientation) {
		this.orientation = orientation;
		this.moving = true;
	}
}

Player.prototype.stopMoving = function(orientation) {
	if(this.orientation === orientation) {
		this.moving = false;
	}
}

// Fire
// Turn turret
// Turn vehicle
// 

// Expose the class to Node.js
module.exports = Player;