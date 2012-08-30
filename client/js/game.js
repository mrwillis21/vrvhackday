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

    // This can live wherever in this file.
    var connector = new Connector("mwillis.pyxisit.com","1337"); // TODO: Set these values elsewhere.
    connector.onConnectSuccess(function(data) {
        clientID = data.id;
        console.log("Connected.");
    });
    connector.onBoardUpdate(function(data) {
        console.log("Received update message from server...");
        console.dir(data);
    });
    connector.connect(); 

    var animator = new Animator(drawBoardState).startAnimation();
    
    $(document).keydown(function(e) {
        var message = new NetworkMessage("keyDown");
        message.putData("id", clientID);
        message.putData("keyCode", e.which);
        connector.sendMessage(message);
    });

    $(document).keyup(function(e) {
        var message = new NetworkMessage("keyUp");
        message.putData("id", clientID);
        message.putData("keyCode", e.which);
        connector.sendMessage(message);
    });

    function drawBoardState() {
        // TODO: Grab latest board snapshot (list of players, bullets, etc.)
        // 
        grid.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
        var boardSnapshot = {}; // TODO: Get the board snapshot at now-75 ms with a loop. Drop off any snapshots that are older.
        var players = boardSnapshot.players;
        for(var playerID in players) {
            var player = players[playerID];
            grid.fillStyle = player.color;

            var playerX = player.x;
            var playerY = player.y;
            var playerSize = player.size;
            // INTERPOLATE!
            // ... to find playerX and playerY
            grid.fillRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);
        }
        // TODO: Draw ordnance, etc.
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