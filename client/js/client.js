$(function () {
    "use strict";
    
    var game = $('#game');
    var input = $('#input');
    var status = $('#status');
    
    var grid_canvas = document.getElementById("game");
    var grid = grid_canvas.getContext("2d");
    
    var board = new Object();
    
    var players = new Object();
    
    var myId = -1;
    var myColor = "";
    
    var squareSize = 10;
    
    var started = false;
    
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    var connection = new WebSocket('ws://172.17.2.241:1337');

    connection.onopen = function () {
        // connection is opened and ready to use
        input.removeAttr('disabled');
        status.text('Enter Name:');
    };

    connection.onerror = function (error) {
        // an error occurred when sending/receiving data
        status.text('Error');
    };

    connection.onmessage = function (message) {
        // try to decode json (I assume that each message from server is json)
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        // handle incoming message
        
        if (json.type === 'connectsuccess') {
            // Grab my id
            myId = json.yourid;
            
            // Setup board
            board = json.board;
            grid_canvas.width = board.width;
            grid_canvas.height = board.height;
            grid.clearRect(0, 0, board.width, board.height);
            grid.fillStyle = board['background-color'];
            grid.fillRect(0, 0, board.width, board.height);
            status.text('Board initialized');
            
            /*
            // set the scene size
            var WIDTH = 400,
                HEIGHT = 300;

            // set some camera attributes
            var VIEW_ANGLE = 45,
                ASPECT = WIDTH / HEIGHT,
                NEAR = 0.1,
                FAR = 10000;

            // get the DOM element to attach to
            // - assume we've got jQuery to hand
            var $container = $('#game');

            // create a WebGL renderer, camera
            // and a scene
            var renderer = new THREE.WebGLRenderer();
            var camera = new THREE.PerspectiveCamera(
                               VIEW_ANGLE,
                               ASPECT,
                               NEAR,
                               FAR );

            var scene = new THREE.Scene();

            // the camera starts at 0,0,0 so pull it back
            camera.position.z = 300;

            // start the renderer
            renderer.setSize(WIDTH, HEIGHT);

            // attach the render-supplied DOM element
            $container.append(renderer.domElement); */
        } else if (json.type === 'update') {
            // Add players
            players = json.players;
            for (var i=0; i < players.length; i++) {
                if (players[i].id == myId) {
                    myColor = players[i].color;
                }
                grid.fillStyle = players[i].color;
                var position = players[i].position;
                grid.fillRect(position.x-(squareSize/2),position.y-(squareSize/2),squareSize,squareSize);
            }
            status.text('Players initialized');
            started = true;
        } else if (json.type === 'messages') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
            addMessage(json.data.author, json.data.text, new Date(json.data.time));
        }
    };
    
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
            connection.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');
        }
    });
    
    $(document).keydown(function(e) {
        if (started === true) {
            if (e.keyCode === 38) {
                // UP
                var position = players[myId].position;
                updatePlayerPosition(myId, position.x, position.y-5);
                sendPosition();
            } else if (e.keyCode === 40) {
                // DOWN
                var position = players[myId].position;
                updatePlayerPosition(myId, position.x, position.y+5);
                sendPosition();
            } else if (e.keyCode === 37) {
                // LEFT
                var position = players[myId].position;
                updatePlayerPosition(myId, position.x-5, position.y);
                sendPosition();
            } else if (e.keyCode === 39) {
                // RIGHT
                var position = players[myId].position;
                updatePlayerPosition(myId, position.x+5, position.y);
                sendPosition();
            }
        }
    });
    
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                             + 'with the WebSocket server.');
        }
    }, 3000);
    
    function addMessage(author, message, color, dt) {
        game.append('<p><span>' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
    }
    
    function sendPosition() {
        var jsonmsg = JSON.stringify( { type : 'move', id : myId, 'new-pos' : { 'x' : players[id].position.x, 'y' : players[id].position.y, 'o' : players[id].position.o } } );
        connection.send(jsonmsg);
    }
    
    function updatePlayerPosition(id, x, y) {
        var oldPosition = players[id].position;
        grid.clearRect(oldPosition.x-(squareSize/2),oldPosition.y-(squareSize/2),squareSize,squareSize);
        grid.fillStyle = board['background-color'];
        grid.fillRect(oldPosition.x-(squareSize/2),oldPosition.y-(squareSize/2),squareSize,squareSize);
        grid.fillStyle = players[id].color;
        grid.fillRect(x-(squareSize/2),y-(squareSize/2),squareSize,squareSize);
        players[id].position.x = x;
        players[id].position.y = y;
    }
});