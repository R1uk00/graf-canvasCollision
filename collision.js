const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const window_height = window.innerHeight;
const window_width = window.innerWidth;
canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#ff8";

class Circle {
    constructor(x, y, radius, color, text, speed) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color; // Este es el color aleatorio único
        this.text = text;
        this.speed = speed;

        // Dirección aleatoria multiplicada por la velocidad (1 a 5)
        let angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        
        this.flashCounter = 0; 
    }

    draw(context) {
        context.beginPath();
        // El azul SOLO se muestra si flashCounter > 0
        let renderColor = (this.flashCounter > 0) ? "#0000FF" : this.color;
        
        context.strokeStyle = renderColor;
        context.fillStyle = renderColor;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `bold ${this.radius/2}px Arial`;
        context.fillText(this.text, this.posX, this.posY);

        context.lineWidth = 4;
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
        context.stroke();
        context.closePath();

        // El contador disminuye en cada frame para que el azul sea temporal
        if (this.flashCounter > 0) this.flashCounter--;
    }

    update(context) {
        // REBOTE EN PAREDES: Aquí NO llamamos a flash()
        if (this.posX + this.radius > window_width || this.posX - this.radius < 0) {
            this.dx = -this.dx;
            // Corregimos posición para no quedar atrapado en el borde
            this.posX = (this.posX - this.radius < 0) ? this.radius : window_width - this.radius;
        }
        if (this.posY + this.radius > window_height || this.posY - this.radius < 0) {
            this.dy = -this.dy;
            this.posY = (this.posY - this.radius < 0) ? this.radius : window_height - this.radius;
        }

        this.posX += this.dx;
        this.posY += this.dy;

        this.draw(context);
    }

    // Método para activar el destello azul (Solo se llamará en colisión de círculos)
    flash() {
        this.flashCounter = 10; 
    }
}

let circles = [];

function generateCircles(n) {
    for (let i = 0; i < n; i++) {
        let radius = Math.random() * 20 + 20;
        let x = Math.random() * (window_width - radius * 2) + radius;
        let y = Math.random() * (window_height - radius * 2) + radius;
        
        // Colores aleatorios vivos
        let color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        let speed = Math.random() * 4 + 1; // Velocidad entre 1 y 5
        
        circles.push(new Circle(x, y, radius, color, (i + 1).toString(), speed));
    }
}

function resolveCollisions() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            let c1 = circles[i];
            let c2 = circles[j];

            let dx = c2.posX - c1.posX;
            let dy = c2.posY - c1.posY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let minDistance = c1.radius + c2.radius;

            if (distance < minDistance) {
                // AQUÍ es donde ocurre el flash (Colisión entre círculos)
                c1.flash();
                c2.flash();

                // Intercambio de velocidades para el rebote
                let tempDx = c1.dx;
                let tempDy = c1.dy;
                c1.dx = c2.dx;
                c1.dy = c2.dy;
                c2.dx = tempDx;
                c2.dy = tempDy;

                // Separación inmediata para evitar que se peguen
                let overlap = minDistance - distance;
                let nx = dx / distance; 
                let ny = dy / distance; 
                c1.posX -= nx * (overlap / 2);
                c1.posY -= ny * (overlap / 2);
                c2.posX += nx * (overlap / 2);
                c2.posY += ny * (overlap / 2);
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, window_width, window_height);
    resolveCollisions();
    circles.forEach(circle => circle.update(ctx));
    requestAnimationFrame(animate);
}

generateCircles(20);
animate();