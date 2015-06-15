//Exports:
var main;
  
//Locals:
(function(){
  $("#subm").hide();
  
  var score = 0;
  
  var GRID_WIDTH = 5;
  var GRID_HEIGHT = 10;
  var BLOCKSIZE = 50;
  var SCROLL_SPEED = 0.01
  
  var THRESHOLD = 1;
  
  //What's the mouse over
  var hoverX, hoverY;
  
  //What's selected
  var selectX = -1;
  var selectY = -1;
  
  var swap = false;
  
  var EMPTY = 0;
  var BLUE = 1;
  var RED = 2;
  var YELLOW = 3;
  var GREEN = 4
  
  var context; // Canvas Context
  
  var scroll = 0;
  var grid;
  
  var lastTime = null;
  var gamePlaying = true;
  currentColor = RED;
  
  var critgX, critgY;
  
  function fillGrid(fill){
  	var toSender = [];
  	for(var i = 0; i < GRID_WIDTH; i++){
  		toSender[i] = [];
  		for(var j = 0; j < GRID_HEIGHT; j++){
  			toSender[i][j] = fill;
  		}
  	}
  	return toSender;
  };
  
  function addRow(){
  
  	//Currently this forms a pattern, TODO: Make it random
  
  	for(i in grid){
  		if(currentColor == RED){
  			currentColor = YELLOW
  		} else if(currentColor == GREEN){
  			currentColor = BLUE
  		} else if(currentColor == YELLOW){
  			currentColor = RED
  		} else if(currentColor = BLUE){
  			currentColor = GREEN
  		};
  		grid[i][GRID_HEIGHT - 1] = currentColor;
  	}
  	if(currentColor == RED || currentColor == YELLOW){
  		currentColor = BLUE;
  	}else{
  		currentColor = RED;
  	}
  };
  
  function colorTableInner( color ){
  	switch (color){
  		case EMPTY:
  			return "black";
  			break;
  		case BLUE:
  			return "aqua";
  			break;
  		case RED:
  			return "red";
  			break;
  		case YELLOW:
  			return "yellow";
  			break;
  		case GREEN:
  			return "lime";
  			break;
  		default:
  			return "white"
  	}
  };
  function colorTableOuter( color ){
  		switch (color){
  		case EMPTY:
  			return "black";
  			break;
  		case BLUE:
  			return "blue";
  			break;
  		case RED:
  			return "brown";
  			break;
  		case YELLOW:
  			return "olive";
  			break;
  		case GREEN:
  			return "green";
  			break;
  		default:
  			return "white"
  	}
  }
  function draw(){
  	for(i in grid){
  		for(j in grid[i]){
  			if(/*grid[i][j] != EMPTY*/ true){
  				var x = BLOCKSIZE * i;
  				var y = BLOCKSIZE * j;// + scroll;
  				var color = grid[i][j];
  				if(color == EMPTY){
  					//Code to draw an empty block
  					context.fillStyle = colorTableInner(EMPTY);
  					context.fillRect(x, y + (scroll - BLOCKSIZE) , BLOCKSIZE, BLOCKSIZE);
  				}else {
  					//Code to draw a filled block
  					if(i == selectX && j == selectY){
  						context.fillStyle = "white";
  					}else if(i == hoverX && j == hoverY){
  						context.fillStyle = "gray";
  					} else {
  						context.fillStyle = colorTableOuter(color);
  					}
  					context.fillRect(x, y + (scroll - BLOCKSIZE) , BLOCKSIZE, BLOCKSIZE);
  					context.fillStyle = colorTableInner(color);
  					context.fillRect(x + 2, y + (scroll - BLOCKSIZE) + 2 , BLOCKSIZE-4, BLOCKSIZE-4);
  				}
  			}
  		}
  	}
  };
  
  function shiftBlocksUp(){
  	for(var i in grid){
  		for(var j = 0; j < GRID_HEIGHT - 1; j++){
  			grid[i][j] = grid[i][j+1];
  		}
  	}
  };
  
  function checkSwap(){
  	if(swap){
  		carry = grid[hoverX][hoverY];
  		grid[hoverX][hoverY] = grid[selectX][selectY];
  		grid[selectX][selectY] = carry;
  		selectX = -1;
  		selectY = -1;
  		swap = false;
  	}	
  	checkForCrits();
  };
  
  var gameLoop = function(time){
  	//Animation code from Mozilla Developer Network: 
  	//https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame
  	var deltaTime = 0;
  	if(lastTime === null){
  		lastTime = time;
  	} else {
  		deltaTime = time - lastTime;
  		lastTime += deltaTime;
  	}
  	scroll -= (deltaTime * SCROLL_SPEED);
  	if(scroll <= 0){
  		scroll += BLOCKSIZE;
  		
  		if(pileExceeds()){ //Check to see if it has gotten past the top
  			gameOver();
  		} else {
  			shiftBlocksUp();
  			
  			//If there's a block selected, move the selection up too.
  			if(selectY > -1){
  				selectY --;
  			}
  			
  			addRow();
  		}
  	}
  	
  	checkSwap();
  	killCritGroups();
  	draw();
  	context.fillStyle = "white";
  	context.fillText(score, 10, 30);
  	if(gamePlaying){
  		window.requestAnimationFrame( gameLoop );
  	}
  };
  
  function gameOver(){
  	gamePlaying = false;
  	gameSetup("Last score" + score + "click to play again");
  };
  
  function pileExceeds(){
  	for(i in grid){
  		if(grid[i][0] != EMPTY){
  			return true;
  		}
  	}
  	return false;
  };
  
  function checkForCrits(){
  	var checkedGlobal = fillGrid(false);
  	for(i in checkedGlobal){	
  		for(j in checkedGlobal[i]){ (function(){
  			if((!(checkedGlobal[i][j])) && grid[i][j] != EMPTY){
  				//I REALLY REALLY REALLY wanted a scope here, sue me!
  				var matchColor = grid[i][j];
  				var checkedLocal = fillGrid(false);
  				
  				//List of items in the group
  				var groupCacheX = [];
  				var groupCacheY = [];
  				
  				function checkSquare(x, y){
  					/*There's some very bad magic going on here, re: the x/y vs ix/iy.
  					I'm stumped, but it works now, so I can't complain.*/
  					ix = parseInt(x);
  					iy = parseInt(y);
  					if( (ix>=0) && (iy>=0) && (ix < GRID_WIDTH) && (iy < GRID_HEIGHT) ){
  						//alert(( !(checkedLocal[x][y]) ).toString() + (!(checkedGlobal[x][y])).toString());
  						if( ( !(checkedLocal[x][y]) )){
  							checkedLocal[x][y] = true;
  							if(grid[x][y] === matchColor){
  								checkedGlobal[x][y] = true;
  								groupCacheX.push(x);
  								groupCacheY.push(y);
  								checkSquare((ix-1),y);
  								checkSquare((ix+1),y);
  								checkSquare(x,(iy+1));
  								checkSquare(x,(iy-1));
  							}
  						}
  					}
  				}
  				
  				checkSquare(i, j);
  				//Dump all items from this group into the main thing.
  				if( groupCacheX.length > THRESHOLD){
  					while( groupCacheX.length > 0){
  						critgX.push(groupCacheX.pop());
  						critgY.push(groupCacheY.pop());
  					}
  				}
  			}
  		})();}
  	}
  };
  
  function killCritGroups(){
  	while(critgX.length > 0 && critgY.length > 0){
  		grid[critgX.pop()][critgY.pop()] = EMPTY;
  		score ++;
  	}
  };
  
  //Main Function:
  function startGame(){
  	
  	//Setup Mouse Listeners
  	$(document).mousemove(function(event){
  		hoverX = Math.round(((event.pageX-$("#blockcanvas").offset().left) / BLOCKSIZE) -.5);
  		hoverY = Math.round((((event.pageY-$("#blockcanvas").offset().top) - scroll)/ BLOCKSIZE) +.5);
  	});
  	
  	$(document).mouseup( function(){
  		//Note the semantics of &&... the checks at the beginning prevent an error from the second one.
  		if((hoverX < GRID_WIDTH) && (hoverY < GRID_HEIGHT) && (grid[hoverX][hoverY] != EMPTY) ){
  			if(selectX<0){
  				selectX = hoverX;
  				selectY = hoverY;
  			} else {
  				//Check adjacency
  				var xDist = hoverX - selectX;
  				var yDist = hoverY - selectY;
  				if((xDist == 1 || xDist == -1 || xDist == 0) && (yDist == 1 || yDist == -1 || yDist == 0)){
  					swap = true;
  				}
  			}
  		}
  	});
  	
  	gameLoop(0);
  };
  
  function gameSetup(msg){
  	grid = fillGrid(EMPTY);
  	
  	critgX = [];
  	critgY = [];
  	
  	context.clearRect(0,0,250, 450);//This clears it
  	
  	context.font="30px Arial";
  	context.fillText(msg,10,50);
  	
  	$('#blockcanvas').mouseup( function(){
  		$('#blockcanvas').unbind('mouseup');
  		startGame();
  	});
  	
  }
  
  //new main function waits for a keyup before starting
  $(function(){
  	context = $("#blockcanvas")[0].getContext("2d");
  	
  	gameSetup("click to play");
  });

})();
