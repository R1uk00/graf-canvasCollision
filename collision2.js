const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let window_width = window.innerWidth;
let window_height = window.innerHeight;

function resizeCanvas() {
    window_width = window.innerWidth;
    window_height = window.innerHeight;
    canvas.width = window_width;
    canvas.height = window_height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- RECURSOS ---
const imgLancer1 = new Image(); imgLancer1.src = 'assets/images/lancer1.png';
const imgLancer2 = new Image(); imgLancer2.src = 'assets/images/lancer2.png';
const imgRoux = new Image(); imgRoux.src = 'assets/images/rouxkard.png';

const bgMusic = new Audio('assets/sfx/mycastle.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4; 
let isMusicPlaying = false;

// --- ESTADO DEL JUEGO (RESETEO TOTAL AL INICIO) ---
let objectsRemoved = 0; 
let rouxRemoved = 0;    
let circles = [];

let currentLevel = "Baja"; // FORZAR INICIO EN BAJA
let puntosParaSubir = 0;   // FORZAR PROGRESO EN 0
let fallosConsecutivos = 0; 

let uiNeonColor = "#ffffff"; 
let uiFlashTimer = 0; 
let isMutedByStreak = false; 

class Circle {
    constructor(radius) {
        this.radius = radius;
        this.clickFlash = 0; 
        this.init(false, true); // Segundo parámetro indica que es el nacimiento inicial
    }

    init(isMissed = false, isFirstSpawn = false) {
        // Solo procesamos lógica de dificultad si NO es el primer spawn del juego
        if (!isFirstSpawn) {
            if (isMissed) {
                fallosConsecutivos++;
                if (fallosConsecutivos >= 20) {
                    if (currentLevel === "Alta") { currentLevel = "Media"; }
                    else if (currentLevel === "Media") { currentLevel = "Baja"; }
                    fallosConsecutivos = 0;
                    puntosParaSubir = 0;
                }
            } else {
                fallosConsecutivos = 0;
                puntosParaSubir++; 

                if (currentLevel === "Baja" && puntosParaSubir >= 10) {
                    currentLevel = "Media";
                    puntosParaSubir = 0; 
                } 
                else if (currentLevel === "Media" && puntosParaSubir >= 15) {
                    currentLevel = "Alta";
                    puntosParaSubir = 0; 
                }
            }
        }

        this.posX = Math.random() * (window_width - this.radius * 2) + this.radius;
        this.posY = -this.radius - Math.random() * 200;
        
        let rand = Math.random();
        this.type = (rand < 0.05) ? 'roux' : 'lancer';
        this.image = (this.type === 'roux') ? imgRoux : (Math.random() < 0.5 ? imgLancer1 : imgLancer2);

        // Definir velocidad basada en el nivel actual
        let speedMultiplier = (currentLevel === "Alta") ? 1.35 : (currentLevel === "Media") ? 0.95 : 0.6;
        let gravityBase = (currentLevel === "Alta") ? 0.09 : (currentLevel === "Media") ? 0.05 : 0.02;

        this.speed = (Math.random() * 1.5 + 1) * speedMultiplier; 
        let angle = (Math.random() * Math.PI) / 3 + Math.PI / 3; 
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        this.gravity = gravityBase + Math.random() * 0.02;
    }

    draw(context) {
        context.save();
        context.shadowBlur = 15;
        context.shadowColor = "white"; 
        if (this.clickFlash > 0) { context.shadowBlur = 40; context.shadowColor = "#00BFFF"; this.clickFlash--; }
        
        context.beginPath();
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 255, 255, 0.15)";
        context.fill();

        if (this.image.complete) {
            context.save();
            context.beginPath(); context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2); context.clip();
            context.drawImage(this.image, this.posX - this.radius, this.posY - this.radius, this.radius * 2, this.radius * 2);
            context.restore();
        }
        context.beginPath(); context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        context.strokeStyle = "white"; context.lineWidth = 4; context.stroke();
        context.restore();
    }

    update(context) {
        this.dy += this.gravity;
        if (this.posX + this.radius > window_width || this.posX - this.radius < 0) this.dx = -this.dx;
        
        if (this.posY - this.radius > window_height) {
            this.init(true); 
        } else {
            this.posX += this.dx;
            this.posY += this.dy;
            this.draw(context);
        }
    }
}

// ... (Las funciones playSfx, playRandomLaugh, drawUI y resolveCollisions se mantienen iguales)

function playSfx(path, ignoreMute = false, vol = 1.0) {
    if (isMutedByStreak && !ignoreMute) return; 
    const s = new Audio(path); s.volume = vol; s.play().catch(() => {});
}

function playRandomLaugh() {
    isMutedByStreak = true; 
    let rand = Math.random();
    let sPath = (rand < 0.10) ? 'assets/sfx/susielaugh.mp3' : (rand < 0.55) ? 'assets/sfx/lancerlaugh.mp3' : 'assets/sfx/queenlaugh.mp3';
    uiNeonColor = (rand < 0.10) ? "#A020F0" : (rand < 0.55) ? "#0000FF" : "#00FFFF";
    playSfx(sPath, true, 1.0);
    uiFlashTimer = 120; 
    setTimeout(() => { isMutedByStreak = false; uiNeonColor = "#ffffff"; }, 2500);
}

function drawUI() {
    const centerX = window_width / 2;
    const x = centerX - 160, y = 20, w = 320, h = 110, r = 10;
    ctx.save();
    ctx.shadowBlur = (uiFlashTimer > 0) ? 25 : 10;
    ctx.shadowColor = uiNeonColor;
    ctx.fillStyle = "rgba(10, 10, 20, 0.9)";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = uiNeonColor; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for(let i = 0; i < h; i += 4) { ctx.fillRect(x, y + i, w, 1); }
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("DARK WORLD STATUS", centerX, y + 20);
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.fillStyle = "#00BFFF";
    ctx.fillText(`LANCERS: ${objectsRemoved - rouxRemoved}`, centerX, y + 45);
    ctx.fillText(`ROUXLS: ${rouxRemoved}`, centerX, y + 68);
    let cVel = (currentLevel === "Alta") ? "#FF0000" : (currentLevel === "Media") ? "#FFFF00" : "#00FF00"; 
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = cVel;
    ctx.fillText(`► MODO: ${currentLevel.toUpperCase()}`, centerX, y + 95);
    if (uiFlashTimer > 0) uiFlashTimer--;
    ctx.restore();
}

function resolveCollisions() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            let c1 = circles[i]; let c2 = circles[j];
            let dx = c2.posX - c1.posX; let dy = c2.posY - c1.posY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let minD = c1.radius + c2.radius;
            if (dist < minD) {
                [c1.dx, c2.dx] = [c2.dx, c1.dx]; [c1.dy, c2.dy] = [c2.dy, c1.dy];
                let overlap = minD - dist;
                let nx = dx / dist; let ny = dy / dist; 
                c1.posX -= nx * (overlap / 2); c1.posY -= ny * (overlap / 2);
                c2.posX += nx * (overlap / 2); c2.posY += ny * (overlap / 2);
            }
        }
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (!isMusicPlaying) { bgMusic.play(); isMusicPlaying = true; }
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = Math.sqrt((mouseX - c.posX)**2 + (mouseY - c.posY)**2);
        if (d <= c.radius + 20) {
            if (c.type === 'roux') { playSfx('assets/sfx/roux.mp3', true, 0.6); rouxRemoved++; }
            else { playSfx('assets/sfx/lancersplat.mp3', false, 0.8); }
            objectsRemoved++;
            c.clickFlash = 20; 
            if (objectsRemoved % 20 === 0 && objectsRemoved !== 0) playRandomLaugh();
            setTimeout(() => c.init(false), 50);
            break; 
        }
    }
});

function animate() {
    ctx.clearRect(0, 0, window_width, window_height);
    resolveCollisions();
    circles.forEach(circle => circle.update(ctx));
    drawUI();
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
    // RESET TOTAL ANTES DE CREAR NADA
    currentLevel = "Baja";
    puntosParaSubir = 0;
    objectsRemoved = 0;

    for (let i = 0; i < 12; i++) {
        circles.push(new Circle(Math.random() * 15 + 45));
    }
    animate();
});