$(function () {
    "use strict";
    
    var game = $('#game');
    var input = $('#input');
    var status = $('#status');
    var score = $('#score');
    
    var grid_canvas = document.getElementById("game");
    var grid = grid_canvas.getContext("2d");
    
    var clientPlayers = {};
    
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
        
        console.log("Client initialized.");

        this.sendMessage(clientPlayer);

        console.log("Letting the server know I'm here...");

        clientPlayers[clientID] = clientPlayer;
    });
    connector.onBoardUpdate(function(data) {
        console.log("Received update message from server...");
        console.dir(data);

        // Remove any players that have left.
        for(var playerID in clientPlayers) {
            if(!(data.players[playerID])) {
                delete(clientPlayers[playerID]);
                // Note: unless the canvas gets a full refresh on every repaint, we'll need to work out how to incrementally remove players who have disappeared from the screen.
            }
        }

        for (var playerID in data.players) {
            var clientPlayer = clientPlayers[playerID];

            if(!clientPlayer) {
                // Add the player to the client list.
                clientPlayer = new Player(playerID);
                clientPlayers[playerID] = clientPlayer;
            }

            var serverPlayer = data.players[playerID];

            clientPlayer.id = serverPlayer.id;
            clientPlayer.color = serverPlayer.color;
            clientPlayer.x = serverPlayer.x;
            clientPlayer.y = serverPlayer.y;
            clientPlayer.orientation = serverPlayer.orientation;
            clientPlayer.size = serverPlayer.size;
            clientPlayer.speed = serverPlayer.speed;
            clientPlayer.maxHP = serverPlayer.maxHP;
        }
    });
    connector.connect(); 

    var animator = new Animator(drawBoardState).startAnimation();
    
    $(document).keydown(function(e) {
        var updateState = false;
        if (e.which === 38) {
            // UP
            clientPlayers[clientID].startMoving("U");
            updateState = true;
        } else if (e.which === 40) {
            // DOWN
            clientPlayers[clientID].startMoving("D");
            updateState = true;
        } else if (e.which === 37) {
            // LEFT
            clientPlayers[clientID].startMoving("L");
            updateState = true;
        } else if (e.which === 39) {
            // RIGHT
            clientPlayers[clientID].startMoving("R");
            updateState = true;
        } else if (e.which === 32) {
            //sendFire();
        }

        if(updateState) {
            connector.sendMessage({type: "statechange", player: clientPlayers[clientID]});
        }
    });

    $(document).keyup(function(e) {
        var updateState = false;
        if (e.which === 38) {
            // UP
            clientPlayers[clientID].stopMoving("U");
            updateState = true;
        } else if (e.which === 40) {
            // DOWN
            clientPlayers[clientID].stopMoving("D");
            updateState = true;
        } else if (e.which === 37) {
            // LEFT
            clientPlayers[clientID].stopMoving("L");
            updateState = true;
        } else if (e.which === 39) {
            // RIGHT
            clientPlayers[clientID].stopMoving("R");
            updateState = true;
        }

        if(updateState) {
            connector.sendMessage({type: "statechange", player: clientPlayers[clientID]});
        }
    });

    function drawBoardState() {
        grid.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
        for(var playerID in clientPlayers) {
            drawPlayer(playerID);
        }
        // TODO: Draw ordnance, etc.
    }

    function drawPlayer(id) {
        grid.fillStyle = clientPlayers[id].color;

        // FIXME: Clear old position if we don't use full clear/repaint cycles for performance reasons.
        /*var playerX = clientPlayers[id].x;
        var playerY = clientPlayers[id].y;
        var playerSize = clientPlayers[id].size;
        grid.clearRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);*/

        // TODO: Verify that the next move is valid before allowing it.
        clientPlayers[id].move();

        var playerX = clientPlayers[id].x;
        var playerY = clientPlayers[id].y;
        var playerSize = clientPlayers[id].size;
        // INTERPOLATE!
        // ... to find playerX and playerY
        grid.fillRect(playerX-(playerSize/2), playerY-(playerSize/2), playerSize, playerSize);

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