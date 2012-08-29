$(function () {
    "use strict";
    
    var game = $('#game');
    var input = $('#input');
    var status = $('#status');
    var score = $('#score');
    
    var grid_canvas = document.getElementById("game");
    var grid = grid_canvas.getContext("2d");
    
    var players = new Object();
    
    var clientID = -1;

    // This can live wherever in this file.
    var connector = new Connector("mwillis.pyxisit.com","1337"); // TODO: Set these values elsewhere.
    connector.onConnectSuccess(function(data) {
        clientID = data.player.id;
        var clientPlayer = new Player(clientID);
        clientPlayer.setPosition(data.player.x, data.player.y, data.player.orientation);
        clientPlayer.setColor(data.player.color);
        clientPlayer.setSize(data.player.size);
        clientPlayer.setSpeed(data.player.speed);
        clientPlayer.setMaxHP(data.player.maxHP);
        players[clientID] = clientPlayer;
        
        console.log("Board initialized");
    });
    connector.connect(); 

    var animator = new Animator(drawBoardState).startAnimation();
    
    $(document).keydown(function(e) {
            if (e.keyCode === 38) {
                // UP
                players[clientID].triggerMove("U");
            } else if (e.keyCode === 40) {
                // DOWN
                players[clientID].triggerMove("D");
            } else if (e.keyCode === 37) {
                // LEFT
                players[clientID].triggerMove("L");
            } else if (e.keyCode === 39) {
                // RIGHT
                players[clientID].triggerMove("R");
            } else if (e.keyCode === 32) {
                //sendFire();
            }
    });

    function drawBoardState() {
        for(var playerID in players) {
            drawPlayer(playerID);
        }
        // TODO: Draw ordnance, etc.
    }

    function drawPlayer(id) {
        grid.fillStyle = players[id].color;

        // Clear old position
        var playerX = players[id].x;
        var playerY = players[id].y;
        var playerSize = players[id].size;
        grid.clearRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);

        players[id].move();

        playerX = players[id].x;
        playerY = players[id].y;
        playerSize = players[id].size;
        grid.fillRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);

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