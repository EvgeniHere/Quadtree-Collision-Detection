let bowl = []; //Flakearray 
// Bowl (oder =Müslischale) enthält alle Kugeln (oder =Cornflakes)
let rootCell; //Quadtree-Rootcell
let maxSpeed = 1; //Max Geschwindigkeit der Flake
let force = 1.0; //Kraftfaktor des Wegstoßens einer Flake bei Kollision
let gravity = 0; //Gravitation

let showFPS = true;
let showCells = true; // Zeichne Zellen des Baumes (High Performance Loss!!)
let showFlakesCounter = false; // Zeichne Text: Anzahl der Flakes einer Zelle (High Performance Loss!!)

let num_flakes = 10000; // Anzahl der Flakes (linker mausklick  auf das canvas spawnt kugeln)
let flakeSize = 0; // Größe der Flakes (für auto-ermittlung: = 0 setzen
let maxDepth = 7; //Maximale Tiefe des Baumes (für auto-ermittlung: = 0 setzen)
let maxFlakesPerCell = 6; //Maximale Anzahl der Flakes, die eine zelle halten kann -> ab dann neue kinderzellen ("10" wäre zu lang für eine kleine Zelle zum Anzeigen, daher max "9")

let timer = 1000;
let iterationCounter = 0;
let lastIterationCounter = 0;

//let updateDelay = 16; // Update Intervall
//let updateTimer = 0; // Zeit seit Programmstart bis zum nächsten Update

function setup() {
  createCanvas(1000, 1000);
  
  // Passende Flake-Größe abhängig von Anzahl der Flakes
  if (flakeSize == 0)
    flakeSize = 1000 / (sqrt(num_flakes) * 10);
  
  // Maximale Tiefe des Baumes. Effizienz-Tests versprechen bei log(6) die beste Performance
  if (maxDepth == 0)
    maxDepth = int(log(num_flakes) / log(6));
  
  // Testing
  //console.log("Circles: " + num_flakes)
  //console.log("Circle Diameter: " + flakeSize)
  //console.log("Max Circles p. Cell: " + maxFlakesPerCell);
  
  //Iteriere "Anzahl der Kugeln"-mal und füge der Müslischüssel immer eine neue Cornflake mit zufälliger Position hinzu
  for (let i = 0; i < num_flakes; i++)
    bowl[i] = new Flake(random(0, width), random(0, height));
  
  //Erzeuge Wurzel-Zelle des Baumes (gesamte Zeichenfläche)
  rootCell = new Cell(0, 0, width, height, 0);
  
  // weißen Malstift auswählen, Shapes nicht füllen und Malstift-Thickness setzen
  strokeWeight(flakeSize);
  noFill();
}

function draw() {
  // Wenn UpdateDelay nicht erreicht ist, beende Iteration
  //if (millis() < updateTimer)
    //return;
  //updateTimer += updateDelay;

  //Reset Canvas und Reset Malstift-größe auf flakeSize
  background(0);
  stroke(255,255,255);
  
  // Iteriere über alle Flakes: füge sie einzeln in den Quadtree ein, bewege Flake, zeichne einen Punkt mit dem Malstift an Position der Flake
  for (let i = 0; i < num_flakes; i++) {
    rootCell.addFlake(i);
    
    bowl[i].move();
    
    point(bowl[i].x, bowl[i].y);
  }

  // Zeichne Zellen des Baumes (High Performance Loss!!)
  if (showCells) {
    strokeWeight(1);
    stroke(150,150,150);
    rootCell.drawCells();
    strokeWeight(flakeSize);
  }

  // Lösche den Baum, da alle Flakes bewegt worden sind und
  // sich deshalb in der nächsten Iteration neue Zellen ergeben werden.
  rootCell.clearAll();

  // FPS berechnen und ausgeben
  if (showFPS) {
    strokeWeight(1);
    text("FPS: " + lastIterationCounter, 1, 12);

    iterationCounter++;
    if (millis() >= timer) {
      timer = millis() + 1000;
      lastIterationCounter = iterationCounter;
      iterationCounter = 0;
    }
    strokeWeight(flakeSize);
  }
}

// Only for Testing performances on different maxDepth and maxFlakesPerCell
function keyPressed() {
  if (key == 'w') {
    rootCell.clearAll();
    maxDepth++;
    print("maxDepth: " + maxDepth);
    print("maxFlakesPerCell: " + maxFlakesPerCell);
    print("");
  } else if (key == 's') {
    rootCell.clearAll();
    maxDepth--;
    print("maxDepth: " + maxDepth);
    print("maxFlakesPerCell: " + maxFlakesPerCell);
    print("");
  } else if (key == 'a') {
    maxFlakesPerCell--;
    print("maxDepth: " + maxDepth);
    print("maxFlakesPerCell: " + maxFlakesPerCell);
    print("");
  } else if (key == 'd') {
    maxFlakesPerCell++;
    print("maxDepth: " + maxDepth);
    print("maxFlakesPerCell: " + maxFlakesPerCell);
    print("");
  }
}

// Füge mit Linker-Mausklick neue Flakes hinzu und berechne neue Größen
function mousePressed() {
  /*if (gravity == 0)
    gravity = 0.1;
  else if (gravity == 0.1)
    gravity = -0.1;
  else
    gravity = 0;*/
  
  bowl[num_flakes++] = new Flake(mouseX, mouseY);
  
  flakeSize = 1000 / (sqrt(num_flakes) * 10);
  maxDepth = int(log(num_flakes) / log(6));
  strokeWeight(flakeSize);

  // prevent default
  return false;
}


// Klasse für eine Zelle des Quadtrees
class Cell {
  // Erzeuge neue Zelle mit Position, Größe und Tiefe
  constructor(posX, posY, cellWidth, cellHeight, depth) {
    this.posX = posX;
    this.posY = posY;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.depth = depth;
    this.flakes = []; // Hält die zu der Zelle zugehörigen Flakes
    this.cells = []; // Hält Kinder-Zellen (leer oder Länge 4)
  }
  
  // Lösche den Teilbaum ab und inklusive dieser Zelle
  clearAll() {
    this.cells = [];
    this.flakes = [];
  }
  
  // Gib aus ob die Zelle Kinder hat
  hasChildren() {
    return this.cells.length > 0;
  }
  
  // Erzeuge Kinder-Zellen
  createChildren() {
    let cx = this.posX;
    let cy = this.posY;
    let cw = this.cellWidth/2;
    let ch = this.cellHeight/2;
    
    this.cells[0] = new Cell(cx, cy, cw, ch, this.depth + 1);
    this.cells[1] = new Cell(cx, cy + ch, cw, ch, this.depth + 1);
    this.cells[2] = new Cell(cx + cw, cy, cw, ch, this.depth + 1);
    this.cells[3] = new Cell(cx + cw, cy + ch, cw, ch, this.depth + 1);
  }
  
  // Füge die Flake(-id) den passenden Kinder-Zellen hinzu
  addToChildren(flake_id) {
    // Erhalte die Position des Flake-Objekts mit ID: "flake_id"
    // aus dem globalen bowl-Array
    let fx = bowl[flake_id].x;
    let fy = bowl[flake_id].y;
    
    // Iteriere über die Anzahl der Kinder-Zellen
    // Sollte Flake in mehreren Zellen liegen,
    // füge sie allen Betroffenen hinzu,
    // damit Collision auch Zellen-Übergreifend möglich ist.
    for (let i = 0; i < 4; i++) {
      let cx = this.cells[i].posX;
      let cy = this.cells[i].posY;
      let cw = this.cells[i].cellWidth;
      let ch = this.cells[i].cellHeight;
      
      // Falls Flake "flake_id" Positionsmäßig in Zelle i liegt, adde sie dort
      if (fx + flakeSize > cx && fx < cx + cw && fy + flakeSize > cy && fy < cy + ch)
        this.cells[i].addFlake(flake_id);
    }
  }
  
  // Füge dem Baum eine Flake(-id) hinzu
  addFlake(flake_id) {
    // Falls Zelle Kinder-Zellen hat, übergebe die Flake an die,
    // sonst adde sie zu den Flakes dieser Zelle
    if (this.hasChildren()) {
      this.addToChildren(flake_id);
      return;
    }
    
    // Falls Flakesanzahl in Zelle die max Anzahl einer Zelle 
    // überschreitet oder die max Tiefe erreicht wurde,
    // erzeuge Kinder-Zellen
    // sonst Prüfe auf Kollisionen
    // (Kein extra Aufruf nötig: Zwei Fliegen mit einer Klappe)
    if (this.flakes.length + 1 <= maxFlakesPerCell || this.depth >= maxDepth) {
      // Prüfe auf Kollisionen mit dieser Flake in dieser Zelle
      this.checkCollision(flake_id);

      // Füge die Flake endgültig der Zelle hinzu
      this.flakes[this.flakes.length] = flake_id;
    } else {
      // Erzeuge neue Kinder-Zellen
      this.createChildren();

      // Übergebe alle Flakes der Zelle den Kinder-Zellen
      for (let i = 0; i < this.flakes.length; i++)
        this.addToChildren(this.flakes[i]);
      
      this.addToChildren(flake_id);
    }
  }
  
  //Prüfe auf Kollisionen einer Flake mit allen aus der Zelle
  checkCollision(flake_id) { 
    let midX1 = bowl[flake_id].x;
    let midY1 = bowl[flake_id].y;

    for (let i = 0; i < this.flakes.length; i++) {
      let midX2 = bowl[this.flakes[i]].x;
      let midY2 = bowl[this.flakes[i]].y;

      let a = midX2 - midX1;
      let b = midY2 - midY1;
      let c = sqrt(a*a + b*b);

      if (c > flakeSize)
        continue;

      let angle = atan2(b, a);
      let targetX = midX1 + cos(angle) * flakeSize;
      let targetY = midY1 + sin(angle) * flakeSize;
      let ax = (targetX - midX2);
      let ay = (targetY - midY2);

      bowl[flake_id].velX -= ax * force;
      bowl[flake_id].velY -= ay * force;
      bowl[this.flakes[i]].velX += ax * force;
      bowl[this.flakes[i]].velY += ay * force;
    }
  }
  
  // Male den Teilbaum
  drawCells() {
    if (this.hasChildren())
      for (let i = 0; i < 4; i++)
        this.cells[i].drawCells();
    else {
      rect(this.posX, this.posY, this.cellWidth, this.cellHeight);
      
      if (showFlakesCounter) {
        text(this.flakes.length, this.posX + this.cellWidth / 2 - 3, this.posY + this.cellHeight / 2 + 5);
      }
    }
  }
}

// Klasse für Kugel (=Flake)
class Flake {
  constructor(x, y) { //Erzeuge Flake
    this.x = x;
    this.y = y;
    this.velX = random(-maxSpeed, maxSpeed);
    this.velY = random(-maxSpeed, maxSpeed);
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
    
    this.velY += gravity;
    
    if (this.x + this.velX + flakeSize/2 > width) {
      this.x = width - flakeSize/2;
      this.velX *= -1;
    } else if (this.x + this.velX - flakeSize/2 < 0) {
      this.x = flakeSize/2;
      this.velX *= -1;
    }
    
    if (this.y + this.velY + flakeSize/2 > height) {
      this.y = height - flakeSize/2;
      this.velY *= -1;
    } else if (this.y + this.velY - flakeSize/2 < 0) {
      this.y = flakeSize/2;
      this.velY *= -1;
    }
    
    this.x += this.velX;
    this.y += this.velY;
  }
}