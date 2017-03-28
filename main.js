//add a start screen

//various bits of code are copied from or inspired the example project: (https://thimbleprojects.org/mfoucault/230435/)
$( document ).ready(function() {
	$("#startGameBTN").click(function() {
		console.log("hello");
		$('#startGameBTN').fadeOut("slow");
		newGame()
		window.requestAnimationFrame(draw)
	});
});


var keys={}
var SPACEBAR=32
var LEFT=37
var RIGHT=39
var LEVEL = 1;
var LOADING = false;

var prevTime=undefined
//var canvas=document.getElementById('canvas')
//console.log(canvas)  //prints null??
var WIDTH= 500;
var HEIGHT= 500;


var MAXSPEED=0.6
var STARTSPEED=0.2
var lives=15;
var gameOver=false

var paddle1=new paddle()
var ball1=new ball()
var blocks=[]//[new block(100,150,50,20,4)
level();
//var levels=2 or 3 D array

//inputs
$(window).keydown(function(event){
	keys[event.keyCode] = true
})
$(window).keyup(function(event){
	delete keys[event.keyCode]
})

function newGame(){
	$('#lives').empty()
	for (var i=0; i<lives; i++){
		$('#lives').append('<i class="fa fa-heart" aria-hidden="true"></i>')
  	}
}


function draw(timestamp){
  	if (prevTime == undefined){
    		prevTime=timestamp
  	}
  	//add more gameOver handling
  	deltaT=timestamp-prevTime
  	var ctx = document.getElementById('canvasGame').getContext('2d')
  	ctx.fillStyle = 'rgba(255,255,255,0 )'
  	ctx.save()
  	ctx.clearRect(0,0,WIDTH,HEIGHT,0)//add some blur and or individual object clearing
  	paddle1.updatePos(deltaT)
  	paddle1.draw(ctx)//may combine these into 1 function per object
  	ball1.updatePosition(deltaT)
  	ball1.draw(ctx)
  	for (var i=0; i<blocks.length; i++){
    		//may add some position updating blocks
    		blocks[i].draw(ctx);
  	}
  	ctx.restore()
  	prevTime=timestamp
  	window.requestAnimationFrame(draw)//why does while not work?
}

function level(){
	$.getJSON("levels.json", function(json) {
		for(var z = 0; z < json.levels.length; z++){
		 	if(json.levels[z].level_id == LEVEL){
		   		var blockWidth = WIDTH/ json.levels[z].colNum;
		   		var blockHeight = HEIGHT/(2.5 * json.levels[z].rowNum)
		   		var PADDING = 3
		   		for( var y = 0; y < json.levels[z].rowNum; y++){
					for(var x = 0; x < json.levels[z].colNum; x++){
			  			blocks.push(new Block(x*blockWidth+PADDING, y*blockHeight+PADDING, blockWidth-2*PADDING, blockHeight-2*PADDING, json.levels[z].dur[y][x]))
					}
		   		}
		 	}
	    	}
    	});
}

function removeBlock(block){
  	/*http://stackoverflow.com/questions/5767325/how-to-remove-a-particular-element-from-an-array-in-javascript
  	is ths source for the next 4 lines
  	*/
  	var index= blocks.indexOf(block)
  	if (index > -1) {
    		blocks.splice(index, 1);
  	}
  	if(blocks.length <= 0){
    		ball1.newLevel();
    		level();
    	}
}

function paddle() {
  	this.length=60 //mn*
  	this.height=10 //mn*
  	this.color='black'
  	this.speed=0.5

  	this.y= HEIGHT - this.height
  	this.x= WIDTH/2 - this.length/2

  	this.draw = function(ctx){
    	ctx.fillStyle = this.color
    	ctx.fillRect(this.x, this.y, this.length, this.height)
  }
  	this.updatePos=function(deltaTime){
    		//console.log(deltaTime)
	    	if (keys[LEFT] && keys[RIGHT]){
	      	return
	    	}else if (keys[LEFT]){
	      	this.x-=deltaTime*this.speed
	    	}else if (keys[RIGHT]){
	      	this.x+=deltaTime*this.speed
	    	}if (this.x<0){
	      	this.x=0
	    	}if (this.x+this.length>WIDTH){
	      	this.x=WIDTH-this.length
	    }
  	}
}

function ball() {
	this.radius= 10
	this.x = 100
	this.y = 100
	this.vx = 0//mn used elsewhere for launch
	this.vy = 0
	this.color='black'
	this.state='ready'//playing and dead are the other states
	//could use cartesian/polar co-ords
  	this.top=function(){
    		return this.y-this.radius
  	}
  	this.bottom=function(){
    		return this.y+this.radius
  	}
  	this.left=function(){
    		return this.x-this.radius
  	}
  	this.right=function(){
    		return this.x+this.radius
  	}
  	this.direction=function(angle){
    		if (angle==undefined){
      		//incomplete
      		Math.arctan(this.vy/this.vx)
    		}
    		var s=this.speed()
    		this.vy= -Math.sin(angle)*s
    		this.vx=Math.cos(angle)*s
  	}
  	this.speed=function(val){//both a setter and a getter
    		if (val==undefined){
      		return Math.sqrt(this.vx*this.vx+this.vy*this.vy)
    		}else{
      		var s=this.speed()
      		this.vx=this.vx/s*val
      		this.vy=this.vy/s*val
    		}
  	}

  	this.draw = function(ctx){
    		if (this.state != 'dead'){
      		ctx.fillStyle=this.color
      		ctx.beginPath()
      		ctx.arc(this.x,this.y,this.radius, 0, Math.PI*2, true)
      		ctx.closePath()
      		ctx.fill()
    		}
  	}

  	this.updatePosition= function (deltaT){
    		if(this.state=='ready'){
      		this.x=paddle1.x+paddle1.length/2
      		this.y=paddle1.y-this.radius
      		if (keys[SPACEBAR]){
        		this.state='playing'
        		this.vy= -STARTSPEED
        		this.vx= 0
      		}
    		}else if (this.state=='playing'){
      		this.x=this.x+this.vx*deltaT
      		this.y=this.y+this.vy*deltaT
      		this.collisions()
    		}
  	}

  	this.bounce= function(direction,line){
    		if (direction=='right'){
      		this.vx = Math.abs(this.vx)
    		}else if (direction=='left'){
      		this.vx = -Math.abs(this.vx)
    		}else if (direction == 'up'){
      		this.vy = -Math.abs(this.vy)
    		}else if (direction=='down'){
      		this.vy = Math.abs(this.vy)
    		}
  	}

  	this.collisions=function(){
		this.bottomCollision()
    		this.borderCollision()
    		this.blockCollision()
  	}

  	this.borderCollision= function(){
		if (this.left()<0){
			this.bounce('right',0)
    		}else if (this.right()>WIDTH){
			this.bounce('left',WIDTH)
    		}
    		if (this.top()<0){
	    		this.bounce('down',0)
    		}
  	}

  	this.bottomCollision= function() {
		if (this.right()>paddle1.x && this.left()<paddle1.x+paddle1.length){
      		if (this.bottom()>paddle1.y){
	        		//this.bounce('up')
	        		var MULTIPLIER= 2
	        		var angle=((Math.acos((this.x-paddle1.x-paddle1.length/2)/paddle1.length))-Math.PI/2)*MULTIPLIER+Math.PI/2
	        		if (!(angle>0+0.1 && angle<Math.PI-0.1)){
	          		if (angle>Math.PI/2){
	            			angle=Math.PI-0.3
	          		}else{
	            			angle=Math.PI*2+0.3
	          		}
	        		}
	        		this.direction(angle)
	        		if(this.speed()<MAXSPEED){
	          		this.speed(this.speed()+0.01)
	        		}
      		}
    		}else if (this.bottom()>HEIGHT){
      		this.bounce('up',0)
      		this.lifeLost()
    		}
  	}


	this.blockCollision= function(){
    		for (var i=0;i<blocks.length ;i++){
      		var block=blocks[i]
      		if(this.top()<block.bottom && this.bottom()>block.top && this.left()<block.right && this.right()>block.left){
	        		var hit=false
	        		if (this.bottom()>block.bottom){
	          		this.bounce('down',block.bottom)
	          		hit=true
	        		}else if (this.top()<block.top){
	          		this.bounce('up',block.top)
	          		hit=true
	        		}
				if(this.left()<block.left){
	          		this.bounce('left',block.right)
	          		hit=true
	        		}else if (this.right()>block.right){
	          		this.bounce('right',block.left)
	          		hit=true
	        		}
	        		if (hit){
	          		block.hit()
				}
	        	}
      	}
    }

	this.lifeLost= function(){//may want to take this out of the ball object
  		lives-=1
  		$('#lives').empty()
    		for (var i=0; i<lives; i++){
      		$('#lives').append('<i class="fa fa-heart" aria-hidden="true"></i>')
    		}
    		if (lives>0){
      		this.state='ready'
      		this.updatePosition(0)
    		}else{
      		this.state='dead'
      		gameOver=true
    		}
  	}

  	this.newLevel= function(){//may want to take this out of the ball object
    		this.state='ready'
    		this.updatePosition(0)
    		if(LEVEL <= 2){
	   		LEVEL += 1;
    		}
  	}
}

function Block (x,y,width,height,durability){
	var blockColors=['red','blue','green','orange']
	this.x=x
	this.y=y
  	this.width=width
  	this.height=height
  	this.durability=durability
  	this.color=blockColors[this.durability-1]
  	this.left=x
  	this.right=x+width
  	this.top=this.y
  	this.bottom=y+height

  	this.draw=function(ctx){
    		if (this.durability>0){
      		ctx.fillStyle=this.color
      		ctx.fillRect(this.x,this.y,this.width,this.height)
    		} else {
      		removeBlock(this);
    		}
  	}

  	this.hit=function(){
    		//console.log('block hit')
    		this.durability-=1
    		if (this.durability<=0){
      		removeBlock(this)
    		}else{
      		this.color=blockColors[this.durability-1]
    		}
  	}
}
