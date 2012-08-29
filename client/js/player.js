var Player = function(id) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.orientation = "U";
	this.color = "#000000";
	this.size = 10;
	this.maxHP = 3;
	this.currentHP = 3;
	this.canFire = true;
	this.moving = false;
	this.speed = 1;
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

Player.prototype.move = function() {
	if(this.moving) {
		// TODO: Verify legal move before moving. Should the entity take care of this or the board manager?
		if(this.orientation === "U") {
			this.y = this.y-this.speed;
		}
		else if(this.orientation === "D") {
			this.y = this.y+this.speed;
		}
		else if(this.orientation === "L") {
			this.x = this.x-this.speed;
		}
		else if(this.orientation === "R") {
			this.x = this.x+this.speed;
		}
	}
}

Player.prototype.startMoving = function(orientation) {
	// TODO: undefined = "U"?
	this.orientation = orientation;
	this.moving = true;
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