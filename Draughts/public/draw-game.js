function drawBoard(context, board, boardHeight) {
  tileSize = boardHeight/8;
  for (y = 0; y < board.length; y++) {
    for(x = 0; x < board[0].length; x++) {
      if(((x + y) % 2) == 0){
       
		  context.fillStyle="#0066ff";
		    context.shadowBlur=20; 
		  context.shadowColor="black"; 
		  

      }
      else {
        context.fillStyle='rgba(44,62,80,1.1)';
      }
      context.fillRect(x*tileSize,y*tileSize, tileSize, tileSize);
    }
  }
}

function drawPieces(context,board) {
  for(y = 0; y < board.length; y++) {
    for(x=0; x < board.length; x++){
      if(board[y][x]!=null){
        drawPiece(context, board[y][x]);
      }
    }
  }
}

function drawPiece(context, newPiece) {
  if(newPiece.color == 'red') {
    context.fillStyle = 'rgba(193, 66, 66,0)';
	   context.shadowBlur=5; 
context.shadowColor="red"; 
  }
  else if(newPiece.color == 'blue') {
    context.fillStyle = 'rgba(16, 16, 126,0)'
	  context.shadowBlur=5; 
	  context.shadowColor="blue"; 
  }
  context.beginPath();
  context.arc(newPiece.xPos,newPiece.yPos,(tileSize-10)/2,0,2*Math.PI);
  context.stroke();
	context.strokeStyle = '#ffffff' 
	context.fill(); 
	
	context.lineWidth =3;
  if(newPiece.king){
    context.fillStyle = "white"
    fontSize = tileSize/2
    context.font=fontSize+"px Impact";
    context.fillText("K",newPiece.xPos-(tileSize/9),newPiece.yPos+(tileSize/5))
  }
}

function drawGameOver(context, boardHeight, gameOver) {
  tileSize = boardHeight/8;
  context.fillStyle= "#000000"
  context.fillRect(tileSize/2,(tileSize/2)*5,(tileSize/2)*14,(tileSize/2)*6)
  context.fillStyle = "#ffffff"
  var fontSize=tileSize
  context.font=fontSize +"px Impact";
  context.fillText(gameOver,(tileSize/2)*4,(tileSize/2)*8.5)
}


//use a table to draw online players 
//table name is the id(string) of the table 
function drawTable(players, tableName, titles){
  var table = document.getElementById(tableName);
  table.innerHTML = '';
  //create the title 
  createTitle(table, titles);


  var tbody = document.createElement('tbody');
  players.forEach(element => {
    var tr = document.createElement('tr');
    for (var prop in element){
      var td = document.createElement('td');
      td.appendChild(document.createTextNode(element[prop]));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}


//create table title 
//title is an array of titles
function createTitle(table, titles) {
  const tbody = document.createElement("tbody");
  const titleRow = document.createElement("tr");
  const addTitle = function (title) {
      const txt = document.createTextNode(title);
      const th = document.createElement("th");
      th.appendChild(txt);
      titleRow.appendChild(th);
  }
  for (title of titles){
    addTitle(title);
  }

  tbody.appendChild(titleRow);
  table.appendChild(tbody);
}





