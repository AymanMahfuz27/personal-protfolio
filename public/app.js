const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sections = [...document.querySelectorAll(".story[data-shape]")];
const navLinks = [...document.querySelectorAll(".rail-link")];

document.querySelector("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

let activeSection = sections[0];
let activeShape = Number(activeSection.dataset.shape);

function setActiveSection(section) {
  if (!section || activeSection === section) return;
  activeSection = section;
  activeShape = Number(section.dataset.shape);

  navLinks.forEach((link) => {
    const sectionId = link.getAttribute("href").slice(1);
    link.classList.toggle("is-active", sectionId === section.id);
  });
}

function updateActiveSection() {
  const targetY = window.innerHeight * 0.48;
  let nearest = sections[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + Math.min(rect.height, window.innerHeight) * 0.5 - targetY);
    if (distance < nearestDistance) {
      nearest = section;
      nearestDistance = distance;
    }
  }

  setActiveSection(nearest);
}

let scrollFrame;
window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      updateActiveSection();
      scrollFrame = undefined;
    });
  },
  { passive: true },
);

updateActiveSection();

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.count = window.innerWidth < 720 ? 900 : 2200;
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.rotation = 0;
    this.pointerX = 0;
    this.pointerY = 0;
    this.targetPointerX = 0;
    this.targetPointerY = 0;
    this.time = 0;

    for (let index = 0; index < this.count; index += 1) {
      this.particles.push({
        u: this.hash(index * 2.317),
        v: this.hash(index * 4.193 + 17),
        w: this.hash(index * 8.731 + 41),
        x: 0,
        y: 0,
        z: 0,
        phase: this.hash(index * 3.11 + 7) * Math.PI * 2,
      });
    }

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener(
      "pointermove",
      (event) => {
        this.targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        this.targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );

    this.resize();
    this.seedInitialShape();

    if (reducedMotion) {
      this.draw();
    } else {
      window.requestAnimationFrame(this.render);
    }
  }

  hash(value) {
    const sine = Math.sin(value * 91.3458) * 47453.5453;
    return sine - Math.floor(sine);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (reducedMotion) this.draw();
  }

  seedInitialShape() {
    for (const particle of this.particles) {
      const target = this.shape(particle, activeShape);
      particle.x = target.x;
      particle.y = target.y;
      particle.z = target.z;
    }
  }

  shape(particle, shapeIndex) {
    const { u, v, w, phase } = particle;
    const tau = Math.PI * 2;

    if (shapeIndex === 0) {
      const face = Math.floor(w * 6);
      const a = u * 2 - 1;
      const b = v * 2 - 1;
      if (face === 0) return { x: -0.82, y: a * 0.82, z: b * 0.82 };
      if (face === 1) return { x: 0.82, y: a * 0.82, z: b * 0.82 };
      if (face === 2) return { x: a * 0.82, y: -0.82, z: b * 0.82 };
      if (face === 3) return { x: a * 0.82, y: 0.82, z: b * 0.82 };
      if (face === 4) return { x: a * 0.82, y: b * 0.82, z: -0.82 };
      return { x: a * 0.82, y: b * 0.82, z: 0.82 };
    }

    if (shapeIndex === 1) {
      const theta = tau * u;
      const phi = Math.acos(1 - 2 * v);
      const radius = 0.76 + 0.08 * Math.sin(phase * 3);
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
      };
    }

    if (shapeIndex === 2) {
      const branch = w > 0.5 ? Math.PI : 0;
      const y = (u - 0.5) * 1.8;
      const angle = u * Math.PI * 7 + branch;
      const radius = 0.43 + 0.07 * Math.sin(v * tau * 2);
      if (v < 0.18) {
        const bridge = v / 0.18;
        return {
          x: Math.cos(angle) * radius * (bridge * 2 - 1),
          y,
          z: Math.sin(angle) * radius * (bridge * 2 - 1),
        };
      }
      return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
    }

    if (shapeIndex === 3) {
      const columns = 42;
      const column = Math.floor(u * columns);
      const row = Math.floor(v * columns);
      const x = (column / (columns - 1) - 0.5) * 1.65;
      const z = (row / (columns - 1) - 0.5) * 1.45;
      const y = Math.sin(x * 4.5 + this.time * 0.0012) * 0.18 + Math.cos(z * 4.2) * 0.12;
      return { x, y, z };
    }

    if (shapeIndex === 4) {
      const theta = tau * u;
      const phi = tau * v;
      const major = 0.61;
      const minor = 0.19 + w * 0.04;
      return {
        x: (major + minor * Math.cos(phi)) * Math.cos(theta),
        y: minor * Math.sin(phi),
        z: (major + minor * Math.cos(phi)) * Math.sin(theta),
      };
    }

    const radius = Math.sqrt(u) * 0.88;
    const arm = Math.floor(w * 3) * (tau / 3);
    const angle = radius * 8 + arm + (v - 0.5) * 0.7;
    return {
      x: Math.cos(angle) * radius,
      y: (v - 0.5) * 0.18 * (1 - radius) + Math.sin(phase) * 0.025,
      z: Math.sin(angle) * radius,
    };
  }

  render(time) {
    this.time = time;
    this.rotation += 0.00115;
    this.pointerX += (this.targetPointerX - this.pointerX) * 0.03;
    this.pointerY += (this.targetPointerY - this.pointerY) * 0.03;

    for (const particle of this.particles) {
      const target = this.shape(particle, activeShape);
      particle.x += (target.x - particle.x) * 0.045;
      particle.y += (target.y - particle.y) * 0.045;
      particle.z += (target.z - particle.z) * 0.045;
    }

    this.draw();
    window.requestAnimationFrame(this.render);
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);

    const compact = this.width <= 900;
    const centerX = compact ? this.width * 0.64 : Math.min(this.width - 230, Math.max(this.width * 0.765, 770));
    const centerY = compact ? this.height * 0.34 : this.height * 0.43;
    const scale = compact ? Math.min(this.width, this.height) * 0.25 : Math.min(165, this.width * 0.135);
    const rotationY = this.rotation + this.pointerX * 0.08;
    const rotationX = -0.18 + this.pointerY * 0.06;
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const projected = [];
    for (const particle of this.particles) {
      const x1 = particle.x * cosY - particle.z * sinY;
      const z1 = particle.x * sinY + particle.z * cosY;
      const y1 = particle.y * cosX - z1 * sinX;
      const z2 = particle.y * sinX + z1 * cosX;
      const perspective = 2.9 / (3.2 + z2);
      projected.push({
        x: centerX + x1 * scale * perspective,
        y: centerY + y1 * scale * perspective,
        z: z2,
        size: (compact ? 0.72 : 0.76) * perspective,
        phase: particle.phase,
      });
    }

    projected.sort((a, b) => a.z - b.z);

    for (const point of projected) {
      const depth = Math.max(0, Math.min(1, (point.z + 1.15) / 2.3));
      const pulse = reducedMotion ? 0 : Math.sin(this.time * 0.0015 + point.phase) * 0.08;
      const alpha = compact ? 0.22 + depth * 0.38 : 0.33 + depth * 0.58 + pulse;
      const light = 58 + depth * 20;
      context.beginPath();
      context.fillStyle = `hsla(238, 58%, ${light}%, ${Math.max(0.08, alpha)})`;
      context.arc(point.x, point.y, Math.max(0.45, point.size), 0, Math.PI * 2);
      context.fill();
    }
  }
}

const particleCanvas = document.querySelector("#particle-field");
if (particleCanvas) new ParticleField(particleCanvas);
