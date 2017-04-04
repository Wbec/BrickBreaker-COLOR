//various bits of code are copied from or inspired the example project: (https://thimbleprojects.org/mfoucault/230435/)
//some code in the remove block method is from a stack overflow post, more detail on which lines in the method.

//Button isPressed Variable Declarations
var MOBILELEFT = false;
var MOBILERIGHT = false;
var MOBILESPACE = false;

//General Global Declarations
var keys={}
var SPACEBAR=32;
var LEFT=37;
var RIGHT=39;
var LEVEL = 1;
var LOADING = false;
var prevTime=undefined;
var WIDTH= 400;
var HEIGHT= 400;
var MAXSPEED=0.9;
var STARTSPEED=0.3;
var Paddle_START_LENGTH=60;
var lives=1;
var gameOver=false;
//Audio Documentation from MDN and the sound is from here http://themushroomkingdom.net/sounds/wav/smw/smw_coin.wav
//Sound Effects
var startupSound = new Audio("./sfx/smw_coin.wav");
var gameOverSound = new Audio("./sfx/smw_game_over.wav");
var blockBreakSound = new Audio("./sfx/smw_bubble_pop.wav");
var levelCompleteSound = new Audio("./sfx/smw_level_up.wav");
var lifeUpSound = new Audio("./sfx/smw_1-up.wav");
var powerUpSound = new Audio("./sfx/smw_power-up.wav");

//JQUERY handling
$( document ).ready(function() {
  $("#startGameBTN").click(function() {
    //SCREEN ANIMATION. see screen.css
    startupSound.play();
    $("#canvasGame").addClass("screen-on")
    $("#power-button").addClass("power-on")
    $("#startGameBTN").attr("disabled",true);
    setTimeout(function(){ newGame() }, 300 );
    window.requestAnimationFrame(draw)
    //Found on the JQuery Docs https://api.jquery.com/mousedown/
    //Handling Button press simulations
    $("#rightBTN").mousedown( function() {
      MOBILERIGHT = true;
    })
    $("#leftBTN").mousedown( function() {
      MOBILELEFT = true;
    })
    $("#launchBTN").mousedown( function() {
      MOBILESPACE = true;
    })

    $("#rightBTN").mouseup( function() {
      MOBILERIGHT = false;
      $("#rightBTN").removeClass('active');
    })
    $("#leftBTN").mouseup( function() {
      MOBILELEFT = false;
      $("#leftBTN").removeClass('active');
    })
    $("#launchBTN").mouseup( function() {
      MOBILESPACE = false;
      $("#launchBTN").removeClass('active');
    })
    //Hiding the Description
    $("#hide-docs").slideUp(400);
    $("#show-docs").delay(401).slideDown();
    $('#show-docs').delay(402).css("display","flex");
  });
});

//Declaring Game Objects and Initializing th first level
var Paddle1=new Paddle()
var Ball1=new Ball()
var blocks=[]
level();

//input Detection
$(window).keydown(function(event){
  keys[event.keyCode] = true
})
$(window).keyup(function(event){
  delete keys[event.keyCode]
  if($("#rightBTN").hasClass("active")){
    $("#rightBTN").removeClass('active');
  }
  if($("#leftBTN").hasClass("active")){
    $("#leftBTN").removeClass('active');
  }
  if($("#launchBTN").hasClass("active")){
    $("#launchBTN").removeClass('active');
  }
})

//Initalizes the lives whenever a new game is started, draws lives
function newGame(){
  $('#lives').empty()
  for (var i=0; i<lives; i++){
    ( this ).$('#lives').append('<i class="fa fa-heart" aria-hidden="true"></i>')
  }
}

//The Main Draw Function, Draws all things within the camvas element
function draw(timestamp){
  if (prevTime == undefined){
    prevTime=timestamp
  }
  deltaT=timestamp-prevTime
  var ctx = document.getElementById('canvasGame').getContext('2d')
  ctx.fillStyle = 'rgba(255,255,255,0 )'
  ctx.save()
  ctx.clearRect(0,0,WIDTH,HEIGHT,0)
  Paddle1.updatePos(deltaT)
  Paddle1.draw(ctx)
  Ball1.updatePosition(deltaT)
  Ball1.draw(ctx)
  for (var i=0; i<blocks.length; i++){
    blocks[i].draw(ctx);
  }
  ctx.restore()
  prevTime=timestamp
  window.requestAnimationFrame(draw)
}

//Loads in the level from a .json file and loads it into an array of block objects
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

//Removes a block object from the array: usally on collision with a Ball resulting in a negative/0 durability
function removeBlock(block){
  /*http://stackoverflow.com/questions/5767325/how-to-remove-a-particular-element-from-an-array-in-javascript
  	is ths source for the next 4 lines
  	*/
  var index= blocks.indexOf(block)
  if (index > -1) {
    blocks.splice(index, 1);
  }
  if(blocks.length <= 0){
    Ball1.newLevel();
    levelCompleteSound.play();
    level();
  }
}

//The Declaration of the Paddle Object. Contains all code for the Paddle and its functions
function Paddle() {
  this.length=Paddle_START_LENGTH
  this.height=10 //mn*
  this.color='white'
  this.speed=0.5

  this.y= HEIGHT - this.height
  this.x= WIDTH/2 - this.length/2

  this.draw = function(ctx){
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.length, this.height)
  }

  this.updatePos=function(deltaTime){
    if (keys[LEFT] && keys[RIGHT]){
      return
    }else if (keys[LEFT] || MOBILELEFT){
      $("#leftBTN").addClass('active');
      this.x-=deltaTime*this.speed
    }else if (keys[RIGHT] || MOBILERIGHT){
      $("#rightBTN").addClass('active');
      this.x+=deltaTime*this.speed
    }if (this.x<0){
      this.x=0
    }if (this.x+this.length>WIDTH){
      this.x=WIDTH-this.length
    }
  }
}

//The Declaraion of the Ball Object. Contains all code for the Ball and its functions
function Ball() {
  this.radius= 10
  this.x = 100
  this.y = 100
  this.vx = 0
  this.vy = 0
  this.color='white'
  this.state='ready'

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
      Math.arctan(this.vy/this.vx)
    }
    var s=this.speed()
    this.vy= -Math.sin(angle)*s
    this.vx=Math.cos(angle)*s
  }

  this.speed=function(val){
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
      this.x=Paddle1.x+Paddle1.length/2
      this.y=Paddle1.y-this.radius
      if (keys[SPACEBAR] || MOBILESPACE){
        $("#launchBTN").addClass('active');
        this.state='playing'
        this.vy= -STARTSPEED
        this.vx= 0.003
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
    if (this.right()>Paddle1.x && this.left()<Paddle1.x+Paddle1.length){
      if (this.bottom()>Paddle1.y){
        var MULTIPLIER= 2
        var angle=((Math.acos((this.x-Paddle1.x-Paddle1.length/2)/Paddle1.length))-Math.PI/2)*MULTIPLIER+Math.PI/2
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

  this.lifeLost= function(){
    Paddle1.length=Paddle_START_LENGTH
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
    if(gameOver == true){
      gameOverSound.play();
      $("#power-button").removeClass("power-on")
      $("#power-button").attr("disabled",false);
      $("#canvasGame").addClass("screen-off")
      $("#power-button").addClass("power-off")
      $("#hide-docs").slideDown(400);
      $("#show-docs").hide();
      //https://www.w3schools.com/jsref/met_win_settimeout.asp
      //https://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
      //This should fix issue #5 : https://github.com/MykalMachon/BrickBreaker-COLOR/issues/5
      if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
        setTimeout(function(){ location.reload(true)}, 1000 );
      } else {
        setTimeout(function(){ location.reload(false)}, 1000 );
      }

    }
  }

  this.newLevel= function(){
    this.state='ready'
    this.updatePosition(0)
    if(LEVEL <= 3){
      LEVEL += 1;
    }
  }
}

//The Declaraion of the Block Object. Contains all code for the Block and its functions
function Block (x,y,width,height,durability){
  var blockColors=['green','yellow','orange','firebrick']
  this.x=x
  this.y=y
  this.width=width
  this.height=height
  this.durability=durability
  if (durability=='E'){
    this.color='limegreen'
  }else if(durability=='L'){
    this.color='hotpink'
  }else if(this.durability=='F'){
    this.color='red'
  }else if(durability=='S'){
    this.color='aqua'
  }else{
    this.color=blockColors[this.durability-1]
  }
  this.left=x
  this.right=x+width
  this.top=this.y
  this.bottom=y+height

  this.draw=function(ctx){
    if (this.durability>0 || this.durability=="E" || this.durability=="S" || this.durability=="L" || this.durability=='F'){
      ctx.fillStyle=this.color
      ctx.fillRect(this.x,this.y,this.width,this.height)
    }else {
      removeBlock(this);
    }
  }

  this.hit=function(){

    if (this.durability=='E'){
      powerUpSound.play();
      Paddle1.length+=20
      removeBlock(this)
    }else if(this.durability=='L'){
      lifeUpSound.play();
      lives+=1
      if (Ball1.speed>=MAXSPEED){
        lives+=1;
      }
      $('#lives').empty()
      for (var i=0; i<lives; i++){
        $('#lives').append('<i class="fa fa-heart" aria-hidden="true"></i>')
      }
      removeBlock(this)
    }else if(this.durability=='S'){
      powerUpSound.play();
      var s =Ball1.speed()
      if (s*0.5>STARTSPEED*0.75){
        Ball1.speed((Ball1.speed())*0.5)
      }else{
        Ball1.speed(STARTSPEED*0.75)
      }
      removeBlock(this)
    }else if(this.durability=='F'){
      powerUpSound.play();
      var s =Ball1.speed()
      if (s*1.5<MAXSPEED){
        Ball1.speed((Ball1.speed())*1.5)
      }else{
        Ball1.speed(MAXSPEED)
      }
      removeBlock(this)
    }else{
      blockBreakSound.play();
      this.durability-=1
      if (this.durability<=0){
        removeBlock(this)
      }else{
        this.color=blockColors[this.durability-1]
      }
    }
  }
}
