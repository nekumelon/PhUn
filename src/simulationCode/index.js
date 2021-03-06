let code = {};

code['Bezier Curves'] = ` \
const points = [
    { x: 10, y: 5 },
    { x: width - 10, y: height / 2 },
];

const controlPoint = { x: width / 2 - 50, y: height / 2 + 50 };

let mouseDown = false;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown) {
        controlPoint.x = e.offsetX;
        controlPoint.y = e.offsetY;
        draw();
    }
});

draw = () => {
    ctx.clearRect(0, 0, width, height);
    circle(controlPoint.x, controlPoint.y, 5, false);

    points.forEach((point) => {
        circle(point.x, point.y, 5);
    });

    let lastPoint;

    for (let t = 0; t < 1; t += 0.1) {
        const x =
            (1 - t) ** 2 * points[0].x +
            2 * (1 - t) * t * controlPoint.x +
            t ** 2 * points[1].x;
        const y =
            (1 - t) ** 2 * points[0].y +
            2 * (1 - t) * t * controlPoint.y +
            t ** 2 * points[1].y;

        if (lastPoint) {
            line(lastPoint.x, lastPoint.y, x, y);
        } else {
            ctx.fillRect(x, y, 1, 1);
        }

        lastPoint = { x, y };
    }
}

draw();
`;

code['Meta Balls'] = ` \
const points = [
    {
        x: 120,
        y: 100,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
    },
    {
        x: width / 2,
        y: height / 2,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
    },
];

let selectedPoint;

function update() {
    for (let i = 0; i < points.length; i++) {
        const point = points[i];

        if (selectedPoint === point) continue;

        point.x += point.vx;
        point.y += point.vy;

        if (point.x + 50 > width || point.x - 50 < 0) {
            point.vx = -point.vx;
        } else if (point.y + 50 > height || point.y - 50 < 0) {
            point.vy = -point.vy;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
            let sum = 0;

            for (const point of points) {
                const xDist = x - point.x;
                const yDist = y - point.y;

                const dist = Math.sqrt(xDist * xDist + yDist * yDist);
                const recipDist = 900 / (dist * dist);

                sum += 200 * recipDist;
            }

            if (sum < 100) continue;

            ctx.fillRect(x, y, 2, 2);
        }
    }
}

let mouseDown = false;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    selectedPoint = null;
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;

    // Move the closest point
    const closestPoint = points.reduce(
        (prev, curr) => {
            const prevDist = Math.sqrt(
                (prev.x - e.offsetX) * (prev.x - e.offsetX) +
                    (prev.y - e.offsetY) * (prev.y - e.offsetY)
            );
            const currDist = Math.sqrt(
                (curr.x - e.offsetX) * (curr.x - e.offsetX) +
                    (curr.y - e.offsetY) * (curr.y - e.offsetY)
            );

            return prevDist < currDist ? prev : curr;
        },
        { x: 0, y: 0 }
    );

    selectedPoint = closestPoint;
    closestPoint.x = e.offsetX;
    closestPoint.y = e.offsetY;
});

function animate() {
    draw();
    update();

    requestAnimationFrame(animate);
}

animate();
`;

code['N-Body'] = `\
const particles = [];
const G = 6.67408e-11;
const dt = 1000;

for (let i = 0; i < 100; i++) {
    particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        mass: Math.random() * 1000,
    });
}

function update() {
    for (const particle of particles) {
        let xForce = 0;
        let yForce = 0;

        for (const other of particles) {
            if (particle === other) {
                continue;
            }

            const xDist = other.x - particle.x;
            const yDist = other.y - particle.y;

            const dist = Math.sqrt(
                xDist * xDist + yDist * yDist + 1e-10
            );
            const Fg = (G * particle.mass * other.mass) / (dist * dist);

            xForce += xDist * Fg;
            yForce += yDist * Fg;
        }

        const ax = xForce / particle.mass;
        const ay = yForce / particle.mass;
        particle.vx += ax * dt;
        particle.vy += ay * dt;

        if (particle.x <= 0 || particle.x >= width) {
            particle.vx = -particle.vx;
        }

        if (particle.y <= 0 || particle.y >= height) {
            particle.vy = -particle.vy;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
        circle(particle.x, particle.y, particle.mass / 400);
    }
}

function animate() {
    draw();
    update();

    requestAnimationFrame(animate);
}

animate();

let mouseDown = false;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    mouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown || particles.length > 500) return;

    particles.push({
        x: e.offsetX,
        y: e.offsetY,
        vx: 0,
        vy: 0,
        mass: Math.random() * 1000,
    });
});
`;

code['Cloth Simulation'] = `\
let nodes = [];
let springs = [];
var animating = true;

class Node {
    constructor(x, y, fixed, holder) {
        this.x = x;
        this.y = y;
        this.oldx = x;
        this.oldy = y;
        this.fixed = fixed;
        this.holder = holder;
    }
}

class Spring {
    constructor(firstNode, secondNode) {
        this.firstNode = firstNode;
        this.secondNode = secondNode;
        this.len = Math.sqrt(
            Math.pow(firstNode.x - secondNode.x, 2) +
                Math.pow(firstNode.y - secondNode.y, 2)
        );
    }
}

for (let row = 0; row < width / 10; row++) {
    let x = row * 10;

    for (let col = 0; col < 10; col++) {
        let y = col * 10;
        let holder = y === 0 && x % 12 === 0;
        nodes.push(new Node(x, y, holder, holder));

        if (col) {
            springs.push(
                new Spring(
                    nodes[nodes.length - 2],
                    nodes[nodes.length - 1]
                )
            );
        }

        if (row) {
            springs.push(
                new Spring(
                    nodes[nodes.length - 10 - 1],
                    nodes[nodes.length - 1]
                )
            );
        }
    }
}

let gravity = 0.2;
let friction = 0.99;
let bounce = 0.5;
let elasticity = 10;

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let spring of springs) {
        if (spring.removed) continue;

        ctx.beginPath();
        ctx.moveTo(spring.firstNode.x, spring.firstNode.y);
        ctx.lineTo(spring.secondNode.x, spring.secondNode.y);
        ctx.stroke();
    }
}

function update() {
    for (let i = 0; i < springs.length; i++) {
        let spring = springs[i],
            dx = spring.secondNode.x - spring.firstNode.x,
            dy = spring.secondNode.y - spring.firstNode.y,
            distance = Math.sqrt(dx * dx + dy * dy),
            percent = (spring.len - distance) / distance / 2,
            offsetX = dx * percent,
            offsetY = dy * percent;

        if (distance * 2 > spring.len * elasticity) {
            spring.removed = true;
        }

        if (!spring.firstNode.fixed && !spring.removed) {
            spring.firstNode.x -= offsetX;
            spring.firstNode.y -= offsetY;
        }

        if (!spring.secondNode.fixed && !spring.removed) {
            spring.secondNode.x += offsetX;
            spring.secondNode.y += offsetY;
        }
    }

    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.fixed) continue;

        let vx = (node.x - node.oldx) * friction;
        let vy = (node.y - node.oldy) * friction;

        node.oldx = node.x;
        node.oldy = node.y;
        node.x += vx;
        node.y += vy + gravity;

        if (node.x > width) {
            node.x = width;
            node.oldx = node.x + vx * bounce;
        } else if (node.x < 0) {
            node.x = 0;
            node.oldx = node.x + vx * bounce;
        }

        if (node.y > height) {
            node.y = height;
            node.oldy = node.y + vy * bounce;
        } else if (node.y < 0) {
            node.y = 0;
            node.oldy = node.y + vy * bounce;
        }
    }
}

function animate() {
    draw();
    update();

    if (animating) {
        requestAnimationFrame(animate);
    }
}

animate();

let mouseDown = false;
let closestNode;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;

    let closest = 100000;

    for (let node of nodes) {
        if (node.holder) continue;

        let dx = e.offsetX - node.x,
            dy = e.offsetY - node.y,
            distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closest) {
            closest = distance;
            closestNode = node;
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    mouseDown = false;

    closestNode.fixed = false;
    closestNode.held = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;

    let x = e.offsetX;
    let y = e.offsetY;

    closestNode.fixed = true;
    closestNode.held = true;
    closestNode.x = x;
    closestNode.y = y;
});`;

code['Vector Field'] = `\
let vectors = [];
let spacing = 30;

for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
        let vector = {
            dx: Math.random() * 20 - 10,
            dy: Math.random() * 20 - 10,
            addx: 0,
            addy: 0,
            x: x,
            y: y,
        };

        vectors.push(vector);
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < vectors.length; i++) {
        let vector = vectors[i];
        let tox = vector.x + vector.dx + vector.addx;
        let toy = vector.y + vector.dy + vector.addy;
        let angle = Math.atan2(toy - vector.y, tox - vector.x);

        ctx.beginPath();
        ctx.moveTo(vector.x, vector.y);
        ctx.lineTo(tox, toy);

        ctx.lineTo(
            tox - 5 * Math.cos(angle - Math.PI / 6),
            toy - 5 * Math.sin(angle - Math.PI / 6)
        );

        ctx.moveTo(tox, toy);
        ctx.lineTo(
            tox - 5 * Math.cos(angle + Math.PI / 6),
            toy - 5 * Math.sin(angle + Math.PI / 6)
        );

        ctx.stroke();
    }
}

let mousex = 0;
let mousey = 0;
let mouseDownX = 0;
let mouseDownY = 0;
let mouseVector;

canvas.addEventListener('mousemove', function (e) {
    mousex = e.offsetX;
    mousey = e.offsetY;

    let dx = e.offsetX - mouseDownX;
    let dy = e.offsetY - mouseDownY;

    if (mouseVector) {
        mouseVector.addx = dx;
        mouseVector.addy = dy;
    }
});

canvas.addEventListener('mousedown', function (e) {
    mouseDownX = e.offsetX;
    mouseDownY = e.offsetY;

    let vector = {
        dx: 0,
        dy: 0,
        addx: 0,
        addy: 0,
        x: mouseDownX,
        y: mouseDownY,
    };

    mouseVector = vector;

    vectors.push(vector);
});

canvas.addEventListener('mouseup', function (e) {
    mouseVector = null;
});

function update() {
    for (let i = 0; i < vectors.length; i++) {
        let vector = vectors[i];
        vector.dx = ((mousex - vector.x) / 100) * 5;

        vector.dy = ((mousey - vector.y) / 100) * 5;
    }
}

function animate() {
    draw();
    update();
    requestAnimationFrame(animate);
}

animate();
`;

code['Mandelbrot'] = `\
let offsetX = 0;
let offsetY = 0;

function draw(offsetX, offsetY) {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let x0 = -2 + (x / width) * 4 + offsetX;
            let y0 = -1 + (y / height) * 2 + offsetY;
            let x1 = 0;
            let y1 = 0;
            let i = 0;

            while (x1 * x1 + y1 * y1 < 4 && i < 25) {
                let xtemp = x1 * x1 - y1 * y1 + x0;
                y1 = 2 * x1 * y1 + y0;
                x1 = xtemp;
                i++;
            }

            ctx.fillStyle = i === 25 ? 'black' : 'white';
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

canvas.addEventListener('click', function (e) {
    offsetX = e.offsetX / width;
    offsetY = e.offsetY / height;

    draw(offsetX, offsetY);
});

draw(0, 0);
`;

code['Riemann Sum'] = `\
let dx = 10;
let phase = 0;
let lastPoint;

function draw() {
    ctx.clearRect(0, 0, width, height);
    lastPoint = null;

    for (let x = 0; x < width; x++) {
        const y = height - 50 * Math.sin(x / 50 + phase) - 51;
        if (lastPoint) {
            line(lastPoint.x, lastPoint.y, x, y);
        } else {
            ctx.fillRect(x, y, 1, 1);
        }

        lastPoint = { x, y };

        if (x % dx === 0) {
            ctx.fillRect(x, y, dx, height);
        }
    }
}

let mouseDown;

function animate() {
    if (!mouseDown) {
        phase += 0.01;
        draw();
    }

    requestAnimationFrame(animate);
}

animate();

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;

    phase = (e.offsetX / width) * Math.PI * 2;
    draw();
});

resize();
draw();
`;

export default code;
