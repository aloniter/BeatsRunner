import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'node_modules/three/examples/jsm/loaders/GLTFLoader.js',
    external: ['three'],
    output: {
        file: 'js/gltf-loader-bundle.js',
        format: 'iife',
        name: '_GLTFLoaderBundle',
        globals: {
            three: 'THREE'
        },
        banner: '// GLTFLoader bundle for Three.js 0.160.0 (built from ESM → IIFE global)',
        footer: `
// Attach GLTFLoader to the global THREE namespace
if (typeof window !== 'undefined' && window.THREE && typeof _GLTFLoaderBundle !== 'undefined') {
    window.THREE.GLTFLoader = _GLTFLoaderBundle.GLTFLoader;
}`
    },
    plugins: [resolve()]
};
