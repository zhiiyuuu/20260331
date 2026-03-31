let targetColor;
let targetGridX, targetGridY; 
let targetPixelX, targetPixelY; 
let angle = 0;
let score = 0;
let timeLeft = 30;
let gameState = "START"; 
let timerInterval;
let scanRadius = 200; // 縮小掃描範圍
let gridSize = 50;
let scorePopups = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  spawnTarget();
  textFont('Microsoft JhengHei', 'sans-serif');
}

function draw() {
  background(0);
  drawGrid();

  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAYING") {
    // 只有在漸層掃描範圍內且角度對的時候才顯示
    if (isTargetScannedByMouse()) {
      drawTarget();
    }
    
    drawGradientRadar(); // 漸層雷達
    drawUI();
    handlePopups();
    
    // 15 秒一圈 (TWO_PI / (15*60))
    angle += (TWO_PI / (15 * 60)); 
  } else if (gameState === "END") {
    drawGameOver();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawGrid() {
  stroke(25);
  strokeWeight(1);
  for (let i = 0; i <= width; i += gridSize) line(i, 0, i, height);
  for (let j = 0; j <= height; j += gridSize) line(0, j, width, j);
}

function isTargetScannedByMouse() {
  let dx = targetPixelX - mouseX;
  let dy = targetPixelY - mouseY;
  let d = dist(mouseX, mouseY, targetPixelX, targetPixelY);
  
  // 距離檢查
  if (d > scanRadius) return false;

  let targetAngle = atan2(dy, dx);
  if (targetAngle < 0) targetAngle += TWO_PI;
  
  let currentAngle = angle % TWO_PI;
  if (currentAngle < 0) currentAngle += TWO_PI;
  
  // 扇形寬度
  let arcSize = 0.6; 
  if (currentAngle >= arcSize) {
    return (targetAngle >= currentAngle - arcSize && targetAngle <= currentAngle);
  } else {
    return (targetAngle >= (TWO_PI + currentAngle - arcSize) || targetAngle <= currentAngle);
  }
}

function drawGradientRadar() {
  push();
  translate(mouseX, mouseY);
  
  // 1. 建立放射狀漸層 (從中心綠色到邊緣透明)
  let grad = drawingContext.createRadialGradient(0, 0, 0, 0, 0, scanRadius);
  grad.addColorStop(0, 'rgba(0, 255, 0, 0.4)');   // 中心較亮
  grad.addColorStop(0.7, 'rgba(0, 255, 0, 0.1)'); // 中間變淡
  grad.addColorStop(1, 'rgba(0, 255, 0, 0)');     // 邊緣完全透明
  
  drawingContext.fillStyle = grad;
  
  // 2. 畫出漸層扇形
  noStroke();
  arc(0, 0, scanRadius * 2, scanRadius * 2, angle - 0.6, angle);
  
  // 3. 掃描線 (也帶有一點發光感)
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgb(0, 255, 0)';
  stroke(0, 255, 0);
  strokeWeight(2);
  line(0, 0, cos(angle) * scanRadius, sin(angle) * scanRadius);
  pop();
}

function drawTarget() {
  push();
  rectMode(CENTER);
  // 色塊發光效果
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = targetColor;
  
  noStroke();
  fill(targetColor);
  rect(targetPixelX, targetPixelY, gridSize - 10, gridSize - 10, 5);
  
  // 點綴外框
  noFill();
  stroke(255, 150);
  strokeWeight(1);
  rect(targetPixelX, targetPixelY, gridSize - 2, gridSize - 2, 2);
  pop();
}

function drawUI() {
  fill(0, 255, 0);
  textAlign(CENTER, TOP);
  textSize(22);
  text(`[ 掃描週期中 ] 剩餘時間: ${timeLeft}s`, width / 2, 30);
  
  textAlign(LEFT, TOP);
  text(`已成功定位: ${score}`, 30, 30);
}

function handlePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let p = scorePopups[i];
    fill(0, 255, 0, p.opacity);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("TARGET LOCKED", p.x, p.y);
    p.y -= 1;
    p.opacity -= 10;
    if (p.opacity <= 0) scorePopups.splice(i, 1);
  }
}

function drawStartScreen() {
  background(0);
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(45);
  text("深層座標掃描", width / 2, height / 2 - 40);
  textSize(18);
  fill(150);
  text("使用滑鼠漸層範圍搜尋色塊\n找到後點擊，座標會立即重置", width/2, height/2 + 20);
  
  // 按鈕
  let btnW = 160, btnH = 50;
  stroke(0, 255, 0);
  fill(0, 255, 0, 20);
  rect(width/2 - btnW/2, height/2 + 80, btnW, btnH, 5);
  fill(255);
  noStroke();
  text("初始化系統", width/2, height/2 + 105);
}

function drawGameOver() {
  background(0);
  fill(255, 50, 50);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("任務終止", width / 2, height / 2 - 50);
  
  fill(0, 255, 0);
  textSize(28);
  text(`總計擷取座標數: ${score}`, width / 2, height / 2 + 10);
  
  fill(100);
  textSize(16);
  text(`最後目標位置: [ ${targetGridX}, ${targetGridY} ]`, width / 2, height / 2 + 50);
  
  drawTarget(); // 顯示最後一個沒點到的
  
  fill(200);
  text("點擊螢幕重新開始", width / 2, height / 2 + 110);
}

function spawnTarget() {
  let cols = floor(width / gridSize);
  let rows = floor(height / gridSize);
  // 隨機選取格點
  targetGridX = floor(random(1, cols - 1));
  targetGridY = floor(random(3, rows - 1));
  
  targetPixelX = targetGridX * gridSize + gridSize / 2;
  targetPixelY = targetGridY * gridSize + gridSize / 2;
  targetColor = color(random(150, 255), random(150, 255), random(150, 255));
}

function mousePressed() {
  if (gameState === "START") {
    if (mouseX > width/2 - 80 && mouseX < width/2 + 80 &&
        mouseY > height/2 + 80 && mouseY < height/2 + 130) {
      startGame();
    }
  } else if (gameState === "PLAYING") {
    let d = dist(mouseX, mouseY, targetPixelX, targetPixelY);
    // 點擊判定
    if (d < gridSize * 0.8) { 
      score++;
      scorePopups.push({ x: mouseX, y: mouseY - 20, opacity: 255 });
      spawnTarget(); // 立即更換色塊位置
    }
  } else if (gameState === "END") {
    gameState = "START";
  }
}

function startGame() {
  gameState = "PLAYING";
  score = 0;
  timeLeft = 30;
  angle = 0;
  scorePopups = [];
  spawnTarget();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timeLeft > 0) timeLeft--;
    else {
      gameState = "END";
      clearInterval(timerInterval);
    }
  }, 1000);
}