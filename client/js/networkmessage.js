var NetworkMessage = function(type) {
	this.type = type;
	this.timestamp = new Date().getTime();
	this.data = {};
}

NetworkMessage.prototype.putData = function(key, value) {
	this.data[key] = value;
}

NetworkMessage.prototype.removeData = function(key) {
	delete(this.data[key]);
}


// Make accessible to Node.js
if(!(typeof exports === 'undefined')) {
    module.exports = NetworkMessage;
}