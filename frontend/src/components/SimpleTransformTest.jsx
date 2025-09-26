import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export function SimpleTransformTest() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('🚀 SIMPLE TRANSFORM TEST STARTING...');

    // Basic Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Add some basic lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // Create a simple cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    console.log('✅ Cube added to scene');

    // Add orbit controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;

    // Create transform controls
    console.log('🎮 Creating TransformControls...');
    const transformControls = new TransformControls(camera, renderer.domElement);
    
    // Set up transform controls
    transformControls.setSize(2);
    transformControls.setMode('translate');
    scene.add(transformControls);

    console.log('📎 TransformControls added to scene');

    // Immediately attach to cube
    transformControls.attach(cube);
    console.log('🎯 TransformControls attached to cube');
    console.log('Transform controls properties:', {
      object: transformControls.object,
      visible: transformControls.visible,
      enabled: transformControls.enabled,
      mode: transformControls.mode
    });

    // Disable orbit controls when dragging
    transformControls.addEventListener('dragging-changed', (event) => {
      orbitControls.enabled = !event.value;
      console.log('🎯 Dragging:', event.value);
    });

    // Log when object changes
    transformControls.addEventListener('objectChange', () => {
      console.log('🔄 Object transformed:', cube.position, cube.rotation, cube.scale);
    });

    // Keyboard controls
    const handleKeyDown = (event) => {
      switch (event.key.toLowerCase()) {
        case 'w':
          transformControls.setMode('translate');
          console.log('🎮 Mode: translate');
          break;
        case 'e':
          transformControls.setMode('rotate');
          console.log('🎮 Mode: rotate');
          break;
        case 'r':
          transformControls.setMode('scale');
          console.log('🎮 Mode: scale');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      orbitControls.update();
      renderer.render(scene, camera);
    };
    animate();

    console.log('🎬 Animation loop started');
    console.log('🎉 SETUP COMPLETE! Transform controls should be visible around the green cube.');
    console.log('💡 Try pressing W, E, R to switch modes and drag the handles!');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up...');
      document.removeEventListener('keydown', handleKeyDown);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          fontFamily: 'monospace',
          fontSize: '14px',
          maxWidth: '300px'
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#00ff00' }}>
          🧪 Simple Transform Test
        </h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Green cube should have transform handles!</strong>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#ffff00' }}>W</span> - Translate (arrows)
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#ffff00' }}>E</span> - Rotate (circles)
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#ffff00' }}>R</span> - Scale (cubes)
        </div>
        <div style={{ fontSize: '12px', color: '#ccc', marginTop: '15px' }}>
          If you don't see colored handles around the cube, there's a fundamental issue with TransformControls.
        </div>
      </div>
    </div>
  );
}