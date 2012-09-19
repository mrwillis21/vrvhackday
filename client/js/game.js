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
    var acceptableKeys = [37, 38, 39, 40];

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
            var message = new NetworkMessage("keyDown");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            connector.sendMessage(message);
        }
        else if(e.which === 32) { // SPACE BAR
            var message = new NetworkMessage("keyDown");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            connector.sendMessage(message);
        }
    });

    $(document).keyup(function(e) {
        var ts = new Date().getTime();
        if($.inArray(e.which, acceptableKeys) > -1) {
            var message = new NetworkMessage("keyUp");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            connector.sendMessage(message);
        }
    });

    input.keydown(function(e) {
        var ts = new Date().getTime();
        if(e.which === 13 && input.val()) {
            var message = new NetworkMessage("keyDown");
            message.putData("id", clientID);
            message.putData("timestamp", ts);
            message.putData("keyCode", e.which);
            message.putData("name", input.val());
            connector.sendMessage(message);
            input.val("");
        }
    });

    // FIXME - Break out into methods.
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
            score.find("tr").remove();
            score.append('<tr><td>Name</td><td>Score</td><td>Health</td></tr>');
            grid.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
            var players = boardSnapshot1.players;
            var players2 = boardSnapshot2.players;
            var shots = boardSnapshot1.shots;
            var shots2 = boardSnapshot2.shots;
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

                    var o = player2.orientation;
                    if (o === 38) {
                        grid.fillStyle = 'black';
                        grid.fillRect(playerX-(playerSize/8),playerY-playerSize,playerSize/4,playerSize);
                    } else if (o === 40) {
                        grid.fillStyle = 'black';
                        grid.fillRect(playerX-(playerSize/8),playerY,playerSize/4,playerSize);
                    } else if (o === 37) {
                        grid.fillStyle = 'black';
                        grid.fillRect(playerX-playerSize,playerY-(playerSize/8),playerSize,playerSize/4);
                    } else if (o === 39) {
                        grid.fillStyle = 'black';
                        grid.fillRect(playerX,playerY-(playerSize/8),playerSize,playerSize/4);
                    }
                    if (player.id === clientID) {
                        grid.fillStyle = 'white';
                        grid.beginPath();
                        grid.arc(playerX,playerY,playerSize/4,0,Math.PI*2,true);
                        grid.closePath();
                        grid.fill();
                    }
                    grid.fillStyle = 'red';
                    grid.fillRect(playerX-(player.size/2), playerY-(player.size/2)-1, player.size*(player.currentHP/player.maxHP), 1);

                    score.append('<tr><td><font color="' + player2.color + '">' + player2.name + '</font></td><td>' + player2.score + '</td><td>' + player2.currentHP + '</td></tr>');
                }

            }

            // Bullets.
            for(var shotID in shots) {
                var shot = shots[shotID];
                var shot2 = shots2[shotID];

                if(shot && shot2) {
                    var step = (renderTime - boardSnapshot1.timestamp)/(boardSnapshot2.timestamp - boardSnapshot1.timestamp);
                    var shotX = shot.x + ((shot2.x - shot.x) * step);
                    var shotY = shot.y + ((shot2.y - shot.y) * step);

                    grid.fillStyle = 'black';
                    grid.beginPath();
                    grid.arc(shotX,shotY,2,0,Math.PI*2,true);
                    grid.closePath();
                    grid.fill();
                }
            }
        }
    }

});