$(function () {
    "use strict";
    
    var game = $('#game');
    var input = $('#input');
    var status = $('#status');
    var score = $('#score');
    
    var grid_canvas = document.getElementById("game");
    var grid = grid_canvas.getContext("2d");
    
    var clientID = -1;
    var boardSnapshots = [];
    var acceptableKeys = [32, 37, 38, 39, 40];

    // External utilities.
    var animator = new Animator(drawBoardState);
    var connector = new Connector("mwillis.pyxisit.com","1337"); // TODO: Set these values elsewhere.

    // This can live wherever in this file.
    connector.onConnect(function(data) {
        clientID = data.id;
        console.log("Connected.");
        animator.startAnimation();
    });
    connector.onReceiveSnapshot(function(data) {
        //console.dir(data);
        boardSnapshots.push(data.data);
    });
    connector.connect(); 
    
    $(document).keydown(function(e) {
        var ts = new Date().getTime();
        if($.inArray(e.which, acceptableKeys) > -1) {
            var message = new NetworkMessage("key");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            message.putData("direction", "down");
            connector.sendMessage(message);
        }
    });

    $(document).keyup(function(e) {
        var ts = new Date().getTime();
        if($.inArray(e.which, acceptableKeys) > -1) {
            var message = new NetworkMessage("key");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            message.putData("direction", "up");
            connector.sendMessage(message);
        }
    });

    // FIXME
    function drawBoardState() {
        var boardSnapshot1, boardSnapshot2;
        var renderTime = new Date().getTime()-150;
        var unused = 0;
        for(var i = 1; i < boardSnapshots.length; ++i) {
            if(boardSnapshots[i].timestamp >= renderTime) {
                boardSnapshot1 = boardSnapshots[i-1].snapshot;
                boardSnapshot1.timestamp = boardSnapshots[i-1].timestamp;
                boardSnapshot2 = boardSnapshots[i].snapshot;
                boardSnapshot2.timestamp = boardSnapshots[i].timestamp;
                break;
            }
            else {
                unused = i;
            }
        }
        boardSnapshots.splice(0, unused);

        if(boardSnapshot1 && boardSnapshot2) {
            grid.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
            var players = boardSnapshot1.players;
            var players2 = boardSnapshot2.players;
            for(var playerID in players) {
                var player = players[playerID];
                var player2 = players2[playerID];
                if(player && player2) {
                    grid.fillStyle = player.color;
                    // Linear interpolation for the win.
                    var step = (renderTime - boardSnapshot1.timestamp)/(boardSnapshot2.timestamp - boardSnapshot1.timestamp);
                    var playerX = player.x + ((player2.x - player.x) * step);
                    var playerY = player.y + ((player2.y - player.y) * step);
                    var playerSize = player.size;
                    grid.fillRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);
                }
            }
            // TODO: Draw ordnance, etc.
        }
    }

    function drawPlayer(player) {
        

        // The below code is the old code to paint the turrets on the tanks.
        /*grid.fillStyle = "#FFFFFF";
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
        if (id === clientID) {
            grid.fillStyle = 'white';
            grid.beginPath();
            grid.arc(x,y,2,0,Math.PI*2,true);
            grid.closePath();
            grid.fill();
        }
        grid.fillStyle = 'red';
        grid.fillRect(x-(squareSize/2), y-(squareSize/2)-1, squareSize*(players[id].hp/maxHealth), 1);*/
    }

    // Game board class to maintain board state, and handle bounds, and possibly obstacles later.
});