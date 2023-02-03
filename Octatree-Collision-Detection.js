boxSize = 100

let bowl = [];
let rootCell;
let maxSpeed = 0.3;
let force = 10000.0;
let gravity = 0;
let c;

//Beide Designoptionen auf "false" setzen für maximale performance
let showCells = true;
let shiningFlakes = false;

let showBox = true;

let num_flakes = 50;
let flakeSize = 10;
let maxDepth = 6;
let maxFlakesPerCell = 5;

let timer = 1000;
let iterationCounter = 0;
let lastIterationCounter = 0;

function setup() {
  createCanvas(1000, 1000, WEBGL);
  
  if (flakeSize == 0)
    flakeSize = 1000 / (sqrt(num_flakes) * 10);
  
  if (maxDepth == 0)
    maxDepth = int(log(num_flakes) / log(6));
  
  for (let i = 0; i < num_flakes; i++)
    bowl[i] = new Flake(random(-boxSize, boxSize), random(-boxSize, boxSize), random(-boxSize, boxSize), random(-maxSpeed, maxSpeed), random(-maxSpeed, maxSpeed), random(-maxSpeed, maxSpeed));

  rootCell = new Cell(-boxSize, -boxSize, -boxSize, 2 * boxSize, 0);
}

function draw() {
  background(0);
  orbitControl();
  pointLight(255, 255, 255, 0, 2*boxSize, 0);
  pointLight(255, 255, 255, 0, -2*boxSize, 0);
  pointLight(255, 255, 255, 2*boxSize, 0, 0);
  pointLight(255, 255, 255, -2*boxSize, 0, 0);
  
  noStroke();
  if (shiningFlakes)
    ambientMaterial(250);
  else
    fill(255);
  
  for (let i = 0; i < num_flakes; i++) {
    bowl[i].move();
    rootCell.addFlake(i);
    translate(bowl[i].x, bowl[i].y, bowl[i].z);
    sphere(flakeSize);
    translate(-bowl[i].x, -bowl[i].y, -bowl[i].z);
    if (shiningFlakes)
      pointLight(150, 150, 150, bowl[i].x, bowl[i].y, bowl[i].z);
  }
  
  noFill();
  if (showCells) {
    stroke(100);
    strokeWeight(1);
    rootCell.drawCells();
  }

  rootCell.clearAll();
  
  if (showBox)
    drawBox();
}

function drawBox() {
  stroke(255);
  strokeWeight(3);
  box(boxSize*2, boxSize*2, boxSize*2);
}

class Cell {
  constructor(posX, posY, posZ, cellSize, depth) {
    this.posX = posX;
    this.posY = posY;
    this.posZ = posZ;
    this.cellSize = cellSize;
    this.depth = depth;
    this.flakes = [];
    this.cells = [];
  }
  
  clearAll() {
    this.cells = [];
    this.flakes = [];
  }
  
  hasChildren() {
    return this.cells.length > 0;
  }
  
  createChildren() {
    let cx = this.posX;
    let cy = this.posY;
    let cz = this.posZ;
    let cs = this.cellSize/2;
    let d = this.depth + 1;
    
    this.cells[0] = new Cell(cx, cy, cz, cs, d);
    this.cells[1] = new Cell(cx, cy + cs, cz, cs, d);
    this.cells[2] = new Cell(cx + cs, cy, cz, cs, d);
    this.cells[3] = new Cell(cx + cs, cy + cs, cz, cs, d);
    this.cells[4] = new Cell(cx, cy, cz + cs, cs, d);
    this.cells[5] = new Cell(cx, cy + cs, cz + cs, cs, d);
    this.cells[6] = new Cell(cx + cs, cy, cz + cs, cs, d);
    this.cells[7] = new Cell(cx + cs, cy + cs, cz + cs, cs, d);
  }
  
  addToChildren(flake_id) {
    let fx = bowl[flake_id].x;
    let fy = bowl[flake_id].y;
    let fz = bowl[flake_id].z;
    
    for (let i = 0; i < this.cells.length; i++) {
      let cx = this.cells[i].posX;
      let cy = this.cells[i].posY;
      let cz = this.cells[i].posZ;
      let cs = this.cells[i].cellSize;
      
      if (fx + flakeSize > cx && fx < cx + cs && fy + flakeSize > cy && fy < cy + cs && fz + flakeSize > cz && fz < cz + cs)
        this.cells[i].addFlake(flake_id);
    }
  }
  
  addFlake(flake_id) {
    if (this.hasChildren()) {
      this.addToChildren(flake_id);
      return;
    }
    
    if (this.flakes.length <= maxFlakesPerCell || this.depth >= maxDepth) {
      this.checkCollision(flake_id);

      this.flakes[this.flakes.length] = flake_id;
    } else {
      this.createChildren();

      for (let i = 0; i < this.flakes.length; i++)
        this.addToChildren(this.flakes[i]);
      
      this.addToChildren(flake_id);
    }
  }
  
  checkCollision(flake_id) {
    let midX1 = bowl[flake_id].x;
    let midY1 = bowl[flake_id].y;
    let midZ1 = bowl[flake_id].z;

    for (let i = 0; i < this.flakes.length; i++) {
      let midX2 = bowl[this.flakes[i]].x;
      let midY2 = bowl[this.flakes[i]].y;
      let midZ2 = bowl[this.flakes[i]].z;

      let a = midX2 - midX1;
      let b = midY2 - midY1;
      let c = midZ2 - midZ1;
      let d = sqrt(a*a + b*b + c*c);

      if (d > flakeSize * 2)
        continue;

      let angle1 = atan2(b, a);
      let angle2 = atan2(c, a);
      
      let ax = midX1 + cos(angle1) * flakeSize * 2 - midX2;
      let ay = midY1 + sin(angle1) * flakeSize * 2 - midY2;
      let az = midZ1 + sin(angle2) * flakeSize * 2 - midZ2;

      bowl[flake_id].velX -= ax * force;
      bowl[flake_id].velY -= ay * force;
      bowl[flake_id].velZ -= az * force;
      bowl[this.flakes[i]].velX += ax * force;
      bowl[this.flakes[i]].velY += ay * force;
      bowl[this.flakes[i]].velZ += az * force;
    }
  }
  
  drawCells() {
    if (this.hasChildren())
      for (let i = 0; i < this.cells.length; i++)
        this.cells[i].drawCells();
    else {
      if (this.flakes.length == 0)
        return;
        
      let cx = this.posX;
      let cy = this.posY;
      let cz = this.posZ;
      let cs = this.cellSize;
      
      translate(cx + cs/2, cy + cs/2, cz + cs/2);
      box(cs);
      translate(-cx - cs/2, -cy - cs/2, -cz - cs/2);
    }
  }
}

class Flake {
  constructor(x, y, z, velX, velY, velZ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.velX = velX;
    this.velY = velY;
    this.velZ = velZ;
  }
  
  move() { //Mache einen Schritt
    if (this.velX > maxSpeed)
      this.velX = maxSpeed;
    else if (this.velX < -maxSpeed)
      this.velX = -maxSpeed;
      
    if (this.velY > maxSpeed)
      this.velY = maxSpeed;
    else if (this.velY < -maxSpeed)
      this.velY = -maxSpeed;
    
    if (this.velZ > maxSpeed)
      this.velZ = maxSpeed;
    else if (this.velZ < -maxSpeed)
      this.velZ = -maxSpeed;
    
    if (this.x + this.velX + flakeSize > boxSize) {
      this.x = boxSize - flakeSize;
      this.velX *= -1;
    } else if (this.x + this.velX - flakeSize < -boxSize) {
      this.x = -boxSize + flakeSize;
      this.velX *= -1;
    }
    
    if (this.y + this.velY + flakeSize > boxSize) {
      this.y = boxSize - flakeSize;
      this.velY *= -1;
    } else if (this.y + this.velY - flakeSize < -boxSize) {
      this.y = -boxSize + flakeSize;
      this.velY *= -1;
    }
    
    if (this.z + this.velZ + flakeSize > boxSize) {
      this.z = boxSize - flakeSize;
      this.velZ *= -1;
    } else if (this.z + this.velZ - flakeSize < -boxSize) {
      this.z = -boxSize + flakeSize;
      this.velZ *= -1;
    }
    
    this.velY += gravity;
    
    this.x += this.velX;
    this.y += this.velY;
    this.z += this.velZ;
  }
}