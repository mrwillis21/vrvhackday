var Connector = function(url, port) {
	this.url = url;
	this.port = port;
}

Connector.prototype.connect = function() {
	var self = this;
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var connectionURI = 'ws://' + this.url + ':' + this.port;
    console.log("Connecting to " + connectionURI);
    this.connection = new WebSocket(connectionURI);

    this.connection.onopen = function (e) {
    	console.log("Connected to " + this.url);
    };

    this.connection.onerror = function(error) {};

    this.connection.onmessage = function(message) {
    	// try to decode json (I assume that each message from server is json)
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        // handle incoming message
        
        if (json.type === 'connectsuccess') {
            if(self.connectSuccess) {
            	self.connectSuccess(json);
            }
        } else if (json.type === 'update') {
        	if(self.boardUpdate) {
            	self.boardUpdate(json);
        	}
        } else if (json.type === 'messages') { // entire message history
            if(self.messages) {
            	self.messages(json);
            }
        } else if (json.type === 'message') { // it's a single message
            if(self.message) {
            	self.message(json);
            }
        }
    };

    this.connection.onclose = function(e) {};
}

Connector.prototype.sendMessage = function(message) {
	this.connection.send(message);
}

Connector.prototype.onBoardUpdate = function(boardUpdateCallback) {
	this.boardUpdate = boardUpdateCallback;
}

Connector.prototype.onConnectSuccess = function(connectSuccessCallback) {
	this.connectSuccess = connectSuccessCallback;
}

Connector.prototype.onMessages = function(messagesCallback) {
	this.messages = messagesCallback;
}

Connector.prototype.onMessage = function(messageCallback) {
	this.message = messageCallback;
}

