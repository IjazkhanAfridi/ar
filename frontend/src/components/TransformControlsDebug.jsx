import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export function TransformControlsDebug() {
  const containerRef = useRef(null);
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const transformControlsRef = useRef();
  const orbitControlsRef = useRef();
  const animationIdRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🚀 Starting TransformControls Debug Setup...');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Create test objects
    console.log('📦 Creating test objects...');

    // Red Cube
    const redCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    redCube.position.set(-2, 0.5, 0);
    redCube.userData = { name: 'Red Cube', selectable: true };
    scene.add(redCube);

    // Green Sphere
    const greenSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0x00ff00 })
    );
    greenSphere.position.set(0, 0.7, 0);
    greenSphere.userData = { name: 'Green Sphere', selectable: true };
    scene.add(greenSphere);

    // Blue Cylinder
    const blueCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16),
      new THREE.MeshLambertMaterial({ color: 0x0000ff })
    );
    blueCylinder.position.set(2, 0.75, 0);
    blueCylinder.userData = { name: 'Blue Cylinder', selectable: true };
    scene.add(blueCylinder);

    console.log('✅ Test objects created');

    // Create OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.1;
    orbitControlsRef.current = orbitControls;

    // Create TransformControls
    console.log('🎮 Creating TransformControls...');
    const transformControls = new TransformControls(camera, renderer.domElement);
    
    // Configure transform controls
    transformControls.setMode('translate');
    transformControls.setSize(1.5);
    transformControls.setSpace('world');
    
    // Make sure they're visible and enabled
    transformControls.visible = true;
    transformControls.enabled = true;
    
    console.log('TransformControls properties:', {
      mode: transformControls.mode,
      size: transformControls.size,
      space: transformControls.space,
      visible: transformControls.visible,
      enabled: transformControls.enabled
    });

    // Event listeners
    transformControls.addEventListener('dragging-changed', (event) => {
      orbitControls.enabled = !event.value;
      console.log('🎯 Transform controls dragging:', event.value);
    });

    transformControls.addEventListener('objectChange', () => {
      console.log('🔄 Object transformed');
    });

    transformControls.addEventListener('mouseDown', () => {
      console.log('🖱️ Transform controls mouse down');
    });

    transformControls.addEventListener('mouseUp', () => {
      console.log('🖱️ Transform controls mouse up');
    });

    transformControlsRef.current = transformControls;
    scene.add(transformControls);

    console.log('✅ TransformControls added to scene');

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      console.log('🖱️ Click detected');
      
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // Get all selectable objects
      const selectableObjects = [redCube, greenSphere, blueCylinder];
      const intersects = raycaster.intersectObjects(selectableObjects, false);

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        console.log('🎯 Object selected:', selectedObject.userData.name);
        
        // Attach transform controls
        transformControls.attach(selectedObject);
        transformControls.visible = true;
        
        console.log('✅ Transform controls attached to:', selectedObject.userData.name);
        
        // Add visual indicator
        selectedObject.material.emissive.setHex(0x444444);
        
        // Remove emissive from other objects
        selectableObjects.forEach(obj => {
          if (obj !== selectedObject) {
            obj.material.emissive.setHex(0x000000);
          }
        });
        
      } else {
        console.log('🚫 No object selected, detaching controls');
        transformControls.detach();
        transformControls.visible = false;
        
        // Remove emissive from all objects
        [redCube, greenSphere, blueCylinder].forEach(obj => {
          obj.material.emissive.setHex(0x000000);
        });
      }
    };

    // Add click listener
    renderer.domElement.addEventListener('click', handleClick);

    // Keyboard controls
    const handleKeyDown = (event) => {
      if (!transformControls.object) return;
      
      switch (event.key.toLowerCase()) {
        case 'w':
          transformControls.setMode('translate');
          console.log('🎮 Mode: Translate');
          break;
        case 'e':
          transformControls.setMode('rotate');
          console.log('🎮 Mode: Rotate');
          break;
        case 'r':
          transformControls.setMode('scale');
          console.log('🎮 Mode: Scale');
          break;
        case 'escape':
          transformControls.detach();
          console.log('🚫 Deselected');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      orbitControls.update();
      renderer.render(scene, camera);
    };
    animate();

    console.log('🎬 Animation loop started');
    console.log('🎉 TransformControls Debug Setup Complete!');
    console.log('📝 Instructions:');
    console.log('   - Click on red cube, green sphere, or blue cylinder');
    console.log('   - Press W for translate, E for rotate, R for scale');
    console.log('   - Press Escape to deselect');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up...');
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      renderer.domElement.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      
      transformControls.dispose();
      orbitControls.dispose();
      renderer.dispose();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        <div><strong>Transform Controls Debug</strong></div>
        <div>Click on objects to select them</div>
        <div>W - Translate | E - Rotate | R - Scale</div>
        <div>Check browser console for logs</div>
      </div>
    </div>
  );
}