
class Particle {
    constructor(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        // radius of particles
        this.radius = this.randomRanged(5, 20);
        this.color = 'rgb(' + [this.randomRanged(0, 255), this.randomRanged(0, 255), this.randomRanged(0, 255)].join(',') + ')';
        this.rotation = this.randomRanged(0, 360, 1);
        this.speed = this.randomRanged(2, 6);
        this.friction = 0.9;
        this.opacity = this.randomRanged(0, 0.5, 1);
        // y velocity, used for particule y
        // value and incremented with gravity value
        this.yVel = 0;
        this.gravity = 0.1;
    }

    randomRanged(a, b, c) {
        return parseFloat((Math.random() * ((a ? a : 1) - (b ? b : 0)) + (b ? b : 0)).toFixed(c ? c : 0));
    }
}

class Exploder {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ratio = window.devicePixelRatio;
        this.particles = [];

        document.body.appendChild(this.canvas);

        this.canvas.style.position = 'absolute';
        this.canvas.style.left = (this.x - 100) + 'px';
        this.canvas.style.top = (this.y - 100) + 'px';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.width = 200 + 'px';
        this.canvas.style.height = 200 + 'px';
        this.canvas.width = 200 * this.ratio;
        this.canvas.height = 200 * this.ratio;

        this.running = true;
    }
    
    static locExplode(x, y){
        new Exploder(x, y).explode();
    }
    
    static clickExplode(e){
        new Exploder(e.clientX, e.clientY).explode();
    }

    explode() {
        // make some particles
        for (var i = 0; ++i < 25; ) {
            this.particles.push(new Particle(this.canvas));
        }
        // hot it up
        this.renderLoop();
    }

    updateParticle(p, index, array) {

        this.moveOnAngle(p, p.speed);

        p.opacity -= 0.01;
        p.speed *= p.friction;
        p.radius *= p.friction;
        p.yVel += p.gravity;
        p.y += p.yVel;

        // if it's done, delete it and return
        if (p.opacity < 0 || p.radius < 0) {
            array.splice(index, 1);
            return;
        }

        this.ctx.beginPath();
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
    }

    updateParticles() {
        // updateParticle removes finished particles
        // update until they're all gone
        if (this.particles.length > 0) {
            this.particles.forEach(this.updateParticle.bind(this));
        } else {
            // stop and destroy everything
            this.running = false;
            this.canvas.remove();
            // we never made a reference to
            // "this" so it just gets garbage collected
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles(this);
    }

    renderLoop() {
        if (this.running) {
            requestAnimationFrame(this.renderLoop.bind(this));
            this.render(this);
        }
    }

    moveOnAngle(t, n) {
        var a = this.getOneFrameDistance(t, n);
        t.x += a.x, t.y += a.y;
    }

    getOneFrameDistance(t, n) {
        return {
            x: n * Math.cos(t.rotation * Math.PI / 180),
            y: n * Math.sin(t.rotation * Math.PI / 180)
        };
    }

    removeByIndex(array, index) {
        array.splice(index, 1);
    }
}