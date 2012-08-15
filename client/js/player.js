function Player(id) {
	this.id = id;
	this.canFire = true;
	this.moving = false;
	this.x = 0;
	this.y = 0;
	this.o = "U";
	this.speed = 1;
}
Player.prototype.move = function() {
	// TODO: Verify legal move before moving.
	if(this.o === "U") {
		this.y = this.y-speed;
	}
	else if(this.o === "D") {
		this.y = this.y+speed;
	}
	else if(this.o === "L") {
		this.x = this.x-speed;
	}
	else if(this.o === "R") {
		this.x = this.x+speed;
	}
}