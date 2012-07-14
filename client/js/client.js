$(function () {
    "use strict";
    
    var game = $('#game');
    var input = $('#input');
    var status = $('#status');
    var score = $('#score');
    
    var grid_canvas = document.getElementById("game");
    var grid = grid_canvas.getContext("2d");
    
    var board = new Object();
    
    var players = new Object();
    var bullets = new Object();
    
    var myId = -1;
    var myColor = "";
    
    var squareSize = 10;
    var maxHealth = 10;
    
    var started = false;
    
    var acceptFire = true;
    var acceptPosition = true;
    var movementSpeed = 100;
    var bulletRate = 500;
    
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
            maxHealth = board.maxHealth;
            grid_canvas.width = board.width;
            grid_canvas.height = board.height;
            grid.clearRect(0, 0, board.width, board.height);
            grid.fillStyle = board['background-color'];
            grid.fillRect(0, 0, board.width, board.height);
            status.text('Board initialized');
        } else if (json.type === 'update') {
            // Add players
            grid.clearRect(0, 0, board.width, board.height);  
            $("#score").find("tr").remove();   
            players = new Object();
            for (var playerid in json.players) {
                var position = json.players[playerid].position;
                players[playerid] = json.players[playerid];
                updatePlayerPosition(players[playerid].id, position.x, position.y, position.o);
            }
            $('#score').append('<tr><td>Name</td><td>Score</td><td>Health</td></tr>');
            for (var playerid in json.players) {
                var id = json.players[playerid].id;
                if( id === myId) {
                    $('#score').append('<tr><td><font color="' + players[id].color + '">' + players[id].name + '</font></td><td>' + players[id].score + '</td><td>' + players[id].hp + '</td></tr>');
                }
            }
            for (var playerid in json.players) {
                var id = json.players[playerid].id;
                if( id !== myId) {
                    $('#score').append('<tr><td><font color="' + players[id].color + '">' + players[id].name + '</font></td><td>' + players[id].score + '</td><td>' + players[id].hp + '</td></tr>');
                }
            }
            bullets = new Object();
            for (var bulletid in json.bullets) {
                var position = json.bullets[bulletid].position;
                updateBulletPosition(position.x, position.y);
            }
            status.text('Have fun!');
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
            
            var jsonmsg = JSON.stringify( { type : 'changeusername', id : myId, name : msg } );
            // send the message as an ordinary text
            connection.send(jsonmsg);
            
            $(this).val('');
            input.attr('style', 'visibility:hidden');
            $('#name').attr('style', 'visibility:hidden');
        }
    });
    
    $(document).keydown(function(e) {
        if (started === true) {
            if (e.keyCode === 38) {
                // UP
                if (acceptPosition) {
                    players[myId].position.y = players[myId].position.y-board['move-increment'];
                    players[myId].position.o = "U";
                    sendPosition();
                    acceptPosition = false;
                    setTimeout(function() {
                        acceptPosition = true;
                    }, movementSpeed);
                }
            } else if (e.keyCode === 40) {
                // DOWN
                if (acceptPosition) {
                    players[myId].position.y = players[myId].position.y+board['move-increment'];
                    players[myId].position.o = "D";
                    sendPosition();
                    acceptPosition = false;
                    setTimeout(function() {
                        acceptPosition = true;
                    }, movementSpeed);
                }
            } else if (e.keyCode === 37) {
                // LEFT
                if (acceptPosition) {
                    players[myId].position.x = players[myId].position.x-board['move-increment'];
                    players[myId].position.o = "L";
                    sendPosition();
                    acceptPosition = false;
                    setTimeout(function() {
                        acceptPosition = true;
                    }, movementSpeed);
                }
            } else if (e.keyCode === 39) {
                // RIGHT
                if (acceptPosition) {
                    players[myId].position.x = players[myId].position.x+board['move-increment'];
                    players[myId].position.o = "R";
                    sendPosition();
                    acceptPosition = false;
                    setTimeout(function() {
                        acceptPosition = true;
                    }, movementSpeed);
                }
            } else if (e.keyCode === 32) {
                sendFire();
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
        var jsonmsg = JSON.stringify( { type : 'move', id : myId, 'new-pos' : { 'x' : players[myId].position.x, 'y' : players[myId].position.y, 'o' : players[myId].position.o } } );
        connection.send(jsonmsg);
    }
    
    function sendFire() {
        if (acceptFire) {
            _playPewSound();
            var jsonmsg = JSON.stringify( { type : 'fire', id : myId } );
            connection.send(jsonmsg);
            acceptFire = false;
            setTimeout(function() {
                acceptFire = true;
            }, bulletRate);
        }
    }
    
    function updatePlayerPosition(id, x, y, o) {
        var oldPosition = players[id].position;
        grid.fillStyle = board['background-color'];
        grid.fillRect(oldPosition.x-(squareSize/2),oldPosition.y-(squareSize/2),squareSize,squareSize);
        grid.fillStyle = players[id].color;
        grid.fillRect(x-(squareSize/2),y-(squareSize/2),squareSize,squareSize);
        if (o == "U") {
            grid.fillStyle = 'black';
            grid.fillRect(x-(squareSize/8),y-squareSize,squareSize/4,squareSize);
        } else if (o == "D") {
            grid.fillStyle = 'black';
            grid.fillRect(x-(squareSize/8),y,squareSize/4,squareSize);
        } else if (o == "L") {
            grid.fillStyle = 'black';
            grid.fillRect(x-squareSize,y-(squareSize/8),squareSize,squareSize/4);
        } else if (o == "R") {
            grid.fillStyle = 'black';
            grid.fillRect(x,y-(squareSize/8),squareSize,squareSize/4);
        }
        if (id === myId) {
            grid.fillStyle = 'white';
            grid.beginPath();
            grid.arc(x,y,2,0,Math.PI*2,true);
            grid.closePath();
            grid.fill();
        }
        grid.fillStyle = 'red';
        grid.fillRect(x-(squareSize/2), y-(squareSize/2)-1, squareSize*(players[id].hp/maxHealth), 1);
        players[id].position.x = x;
        players[id].position.y = y;
        players[id].position.o = o;
    }
    
    function updateBulletPosition(x, y) {
        grid.fillStyle = 'black';
        grid.beginPath();
        grid.arc(x,y,2,0,Math.PI*2,true);
        grid.closePath();
        grid.fill();
    }

    function _playPewSound() {
        var pewPlayer = $("#pew")[0];
        pewPlayer.pause();
        pewPlayer.currentTime = 0;
        pewPlayer.play();
    }
});