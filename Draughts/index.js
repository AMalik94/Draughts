var express = require('express');
var cradle = require('cradle')
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

//database connection 
//this will store all the user information on the database 
//user information will not be lost even the server is crashed
//===================================================================================
//set up the database 
var userdb = new(cradle.Connection)('http://lyrane.cs.st-andrews.ac.uk:21271', {
    auth: {
        username: "hh72",
        password: "b4hH9m9N"
    }
}).database('userdb');


userdb.exists( (err, exists) => {
    if (err){
        console.log('error', err);
    }else if (exists) {
        console.log('Database found!');
    }else{
        console.log('database not found. Let me create one');
        userdb.create();
    }
})

//define the view to retrive all the user information 
userdb.save('_design/users', {
  user: {
      map: function(doc){
          if(doc.username){
              emit(doc._id, doc.gameWon);
          }
      }
  }
})

server.listen(port,function() {
  console.log('Server listening at port ' + port);
});

app.use(express.static(__dirname + '/public'));
//===================================================================================
var gamesetup = require('./gamesetup');
var pieces = require('./pieces');
var moves = require('./moves');

var numUsers = 0;
var redLoggedIn = false;
var blueLoggedIn = false;
var onlinePlayers = [];

function Game() {
  this.boardHeight = 600;
  this.board = gamesetup.newBoard();
  this.turn = "red";
  gamesetup.initializePieces(this.board, this.boardHeight);
  this.heldPiece=null;
  this.heldX = -1;
  this.heldY = -1;
  this.gameOver = null;
  this.lastMove = null;
}

function Player(){
  this.username = '';
  this.userColor = '';
  this.gameWon = 0;
}

var game = new Game();
console.log(game);

//Event handler for incoming request 
//=============================================================================
io.on('connection', function(socket) {
  socket.on('add user', function(username) {
    numUsers++;
    socket.username = username;
    console.log(socket.username + " has logged in.");
    console.log(numUsers + " users are connected.");
    if(!redLoggedIn) {
      socket.color = "red";
      redLoggedIn = true;
    }
    else if(!blueLoggedIn) {
      socket.color = "blue";
      blueLoggedIn = true;
    }
    else {
      socket.color = "spectator";
    }
    //construct the user information 
    var player = new Player();
    player.username = username;
    player.userColor = socket.color;

    // store it into database 
    // check existence, if exist, create a new one  
    userdb.get(player.username,
    (err, doc) => {
      //doc will return undefined if no existence 
      console.log('new user')
      console.log(doc);
      if(doc == undefined){
        userdb.save(player.username,
        player, function(err,doc){
          console.log(doc);
          emitUserInfo();
        })
      }
      else{
        console.log("It already exists");
        player.gameWon = doc.gameWon;
        console.log(doc);
        player.gameWon = doc.gameWon;
        emitUserInfo();
      }
    })
    
    function emitUserInfo(){
      onlinePlayers.push(player);
      console.log(onlinePlayers);
      console.log(socket.username + " will play as " + socket.color + ".");
      socket.emit('newGame', game, onlinePlayers);
      //send updated user information to other online players 
      socket.broadcast.emit('newPlayer', onlinePlayers);
    }
  });

  socket.on('disconnect', function() {
    if(socket.username) {
      numUsers--;

      //log out the online players 
      onlinePlayers.forEach(function(element, index){
        if(element.username == socket.username){
          onlinePlayers.splice(index,1);
        }
      })
      //send back the information about the player leaving
      socket.broadcast.emit('playerLeave', onlinePlayers);
      console.log(socket.username + " has logged out.")
      console.log(numUsers + " users are connected.");
      console.log(onlinePlayers);
      if(socket.color === "red") {
        redLoggedIn = false;
      }
      else if(socket.color === "blue") {
        blueLoggedIn = false;
      }
    }
  });

  //deal with incoming message 
  socket.on('chat message', function(message){
    message = socket.username + ':' + message;
    console.log('message: ' + message);
    io.emit('chat message', message);
  })

  socket.on('leaderBoard', function(){

    //get all the users from the database
    //i could not find a way that i can get all the users from couchdb 
    //to make use of it and send it back to the client
    var users = [];
    userdb.view('users/user', function (err, docs) {
      if (err) { console.log('Error fetching view'); }
      else {
        console.log(docs);
        for (doc of docs) {
          users.push(doc);
        }
      }
      //sort it 
      users.sort(function compareGameWon(a, b) {
        return b.value - a.value;
      })
      //send back the top 5 to client
      var topUsers =[];
      for(let i=0; i<5; i++){
        topUsers.push(users[i]);
      }

      for(user of topUsers){
        delete user.key;
      }

      io.emit('leaderBoard', topUsers);

    })
  })

  socket.on('mouseDown', function(e) {
    var grab = pieces.grabPiece(game.board, game.turn, socket.color, game.heldPiece, game.heldX, game.heldY, e);
    game.heldPiece = grab.piece;
    game.heldX = grab.x;
    game.heldY = grab.y;
  });

  socket.on('mouseMove', function(e) {
    if(game.heldPiece!=null && game.turn == socket.color){
      game.heldPiece.xPos = e.x;
      game.heldPiece.yPos = e.y;
      io.emit('sync', game.board);
    }
  });

  socket.on('mouseUp', function(e) {
    if(game.heldPiece != null && game.turn == socket.color) {
      placePiece(e);
      gamesetup.initializePieces(game.board, game.boardHeight);
      io.emit('sync', game.board);
    }
  });

  socket.on('mouseOut', function(e) {
    if(game.heldPiece != null && game.turn == socket.color) {
      game.heldPiece = null;
      game.heldX = -1;
      game.heldY = -1;
      gamesetup.initializePieces(game.board, game.boardHeight);
      io.emit('sync', game.board);
    }
  });

});

function placePiece(e) {
  var tileSize = game.boardHeight / 8;
  var kinged = false;
  var dropX = Math.floor(e.x/tileSize);
  var dropY = Math.floor(e.y/tileSize);
  var validMoves = moves.getValidMoves(game.turn, game.board, game.lastMove);
  if(validMoves.length == 0) {
    game.gameOver = game.turn + " can't move.";
  }
     var move = null
    for(x = 0; x < validMoves.length; x++) {
    if(game.heldPiece == validMoves[x].piece && dropX == validMoves[x].newX && dropY == validMoves[x].newY) {
      move = validMoves[x]
    }
  }  
  if(move != null) {
    game.board[dropY][dropX] = game.board[game.heldY][game.heldX];
    game.board[game.heldY][game.heldX] = null;
    if(move.jumpX != -1) {
      game.board[move.jumpY][move.jumpX] = null;
      game.gameOver = pieces.checkWin(game.board);
    }
    if(!game.heldPiece.king && game.heldPiece.color=="red" && dropY==0){
      game.heldPiece.king=true;
      kinged = true;
    }
    else if(!game.heldPiece.king && game.heldPiece.color=="blue" && dropY==game.board.length-1){
      game.heldPiece.king=true;
      kinged = true;
    }
    if(kinged || move.jumpX == -1) {
      game.turn = game.turn == "red" ? "blue" : "red";
    }
    else if(!(move.jumpX != -1 && moves.getJumps(game.board[dropY][dropX],dropX,dropY,game.board).length > 0)) {
      game.turn = game.turn == "red" ? "blue" : "red";
    }
    game.lastMove = move;
  }
  game.heldPiece=null;
  game.heldX = -1;
  game.heldY = -1;


  console.log(game.gameOver);
  if(game.gameOver != null) {
    // get the winner and store it into database 
    var winner; 
    if (game.gameOver == 'Blue Wins'){
      winner = onlinePlayers[1];
      updateGameWon(winner);

    } else if(game.gameOver == 'Red Wins'){
      winner = onlinePlayers[0];
      updateGameWon(winner);
    }

    function updateGameWon(winner){
      var newGameWon = winner.gameWon + 1;
      userdb.merge(winner.username, {
        gameWon: newGameWon
      }, function(err, res){
        console.log('response: ');
        console.log(res);
      })
    }


    io.emit('gameOver', game.gameOver);
  }
}
