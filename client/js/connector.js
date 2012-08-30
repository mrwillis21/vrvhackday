var Connector = function(url, port) {
	this.url = url;
	this.port = port;
    this.isConnected = false;
}

Connector.prototype.connect = function() {
	var self = this;
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var connectionURI = 'ws://' + this.url + ':' + this.port;
    console.log("Connecting to " + connectionURI);
    this.connection = new WebSocket(connectionURI);

    this.connection.onopen = function (e) {
        self.isConnected = true;
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
            if(self.connect_callback) {
            	self.connect_callback(json);
            }
        }
    };

    this.connection.onclose = function(e) {
        self.isConnected = false;
        console.log("Disconnected.");
    };
}

Connector.prototype.sendMessage = function(message) {
    if(this.isConnected) {
	   this.connection.send(JSON.stringify(message));
    }
}

Connector.prototype.onConnect = function(callback) {
	this.connect_callback = callback;
}

