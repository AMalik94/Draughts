$(function() {

  var INTERVAL=50;
  var socket = io();
  var username = "";
  console.log("i am in login")
  $("#game_window").hide();
  var $userNameInput = $('.login-screen__input');
  var $loginScreen = $('.login-screen');
  var canvas = $('.game-canvas').get(0);
  var context = canvas.getContext('2d');
  var board;
  var boardHeight;
  var color;
  var gameOver = "";
  var players;
  canvas.addEventListener('mousedown', playerMouseDown);
  canvas.addEventListener('mousemove', playerMouseMove);
  canvas.addEventListener('mouseup', playerMouseUp);
  canvas.addEventListener('mouseout', playerMouseOut);


  function cleanInput (input) {
    return $('<div/>').text(input.trim()).text();
  }

  $userNameInput.keydown(function (event) {
    if(event.which == 13) {
      setUserName();
    }
  });

  function setUserName() {
    username = cleanInput($userNameInput.val());
    if(username) {
      $loginScreen.fadeOut();
		  $("#game_window").css("display", "block");
		  console.log("login screen fades");
      socket.emit('add user', username);
    }
  }

  //live chat

  //get the message from the html
  //pass it to here
  $('form').submit(function(){
    sendMessage($('#chat').val());
    $('#chat').val('');
    return false;
  });

  function sendMessage(message){
    socket.emit('chat message', message);
  }


  //get the message from the server
  //you need to display the message
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
	 $(".chat-area").css("{'overflow-y': scroll, width:600px, height:'90cm'}")
  });


  socket.on('newGame', function(serverGame, onlinePlayers) {
    board = serverGame.board;
    boardHeight = serverGame.boardHeight;
    players = onlinePlayers;
    console.log(players);
    var titles = [
      'User Name',
      'User Role',
      'Game Won'
    ]
    drawTable(onlinePlayers, 'users', titles);
    socket.emit('leaderBoard');

    //constantly update the board and user information
    setInterval(function() {
      mainLoop();
    }, INTERVAL);
  });

  function mainLoop() {
    drawBoard(context, board, boardHeight);
    drawPieces(context, board);
    if(gameOver != "")
      drawGameOver(context,boardHeight, gameOver);
  }

  //when new player joins the game, need to draw the players table again
  socket.on('newPlayer', function(onlinePlayers){
    console.log(onlinePlayers);
    var titles = [
      'User Name',
      'User Role',
      'Game Won'
    ]
    drawTable(onlinePlayers, 'users', titles);
  })

  //when player leave the game, draw the table again
  socket.on('playerLeave', function(onlinePlayers){
    console.log(onlinePlayers);
    var titles = [
      'User Name',
      'User Role',
      'Game Won'
    ]
    drawTable(onlinePlayers, 'users', titles);
  });


  socket.on('leaderBoard', function(users){
    console.log(users);
    var titles = [
      'User Name',
      'Game Won'
    ]
    drawTable(users, 'topUsers', titles);
  })

  socket.on('sync', function(serverBoard) {
    board = serverBoard;
  });

  socket.on('gameOver', function(serverGameOver) {
    gameOver = serverGameOver;
  });



  function playerMouseDown(e) {
    var click = {
      x: e.x,
      y: e.y
    };
    socket.emit('mouseDown', click);
  }

  function playerMouseMove(e) {
    var move = {
      x: e.x,
      y: e.y
    };
    socket.emit('mouseMove', move);
  }

  function playerMouseUp(e) {
    var release = {
      x: e.x,
      y: e.y
    }
    socket.emit('mouseUp', release);
  }

  function playerMouseOut() {
    socket.emit('mouseOut');
  }

});
