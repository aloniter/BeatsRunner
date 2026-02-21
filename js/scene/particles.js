// ========================================
// PARTICLES - Background Effect (Quality-Aware)
// ========================================

function createParticles() {
    // Use quality-based particle count
    const particleCount = QualityManager.getParticleCount('background');
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 25;
        positions[i * 3 + 2] = Math.random() * 150;
        velocities[i] = 0.3 + Math.random() * 0.7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;

    const material = new THREE.PointsMaterial({
        color: CONFIG.COLORS.CYAN,
        size: 0.15,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// ========================================
// PARTICLE BURST SYSTEM - Impact Effects
// ========================================
class ParticleBurst {
    constructor(scene, position, config = {}) {
        const count = config.count || 20;
        const color = config.color !== undefined ? config.color : 0xff6600;
        const spread = config.spread || 1.0;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        this.velocities = [];

        for (let i = 0; i < count; i++) {
            // Start all particles at the impact point
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Create random outward velocities
            this.velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 10 * spread,
                Math.random() * 8,
                (Math.random() - 0.5) * 10 * spread
            ));
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.3,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.lifetime = 0;
        this.maxLifetime = config.duration || 1.0;
        this.scene = scene;

        scene.add(this.particles);
    }

    update(deltaTime) {
        this.lifetime += deltaTime;

        const positions = this.particles.geometry.attributes.position.array;

        for (let i = 0; i < this.velocities.length; i++) {
            // Apply velocity
            positions[i * 3] += this.velocities[i].x * deltaTime;
            positions[i * 3 + 1] += this.velocities[i].y * deltaTime;
            positions[i * 3 + 2] += this.velocities[i].z * deltaTime;

            // Apply gravity
            this.velocities[i].y -= 20 * deltaTime;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;

        // Fade out over lifetime
        this.particles.material.opacity = 1.0 - (this.lifetime / this.maxLifetime);

        // Return false when burst is complete
        return this.lifetime < this.maxLifetime;
    }

    dispose() {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
    }
}

// Track active particle bursts
let activeBursts = [];

// Create a particle burst at a position
function createParticleBurst(position, config = {}) {
    const burst = new ParticleBurst(scene, position, config);
    activeBursts.push(burst);
    return burst;
}

// Update all active particle bursts
function updateParticleBursts(deltaTime) {
    // Update bursts and filter out completed ones
    activeBursts = activeBursts.filter(burst => {
        const stillActive = burst.update(deltaTime);

        if (!stillActive) {
            burst.dispose();
        }

        return stillActive;
    });
}
