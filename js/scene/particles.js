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
