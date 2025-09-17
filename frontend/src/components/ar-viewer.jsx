import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export function ARViewer({ mindFile, contentConfig, onClose }) {
  const containerRef = useRef(null);
  const mindARRef = useRef(null);
  const transformControlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const sceneObjectsRef = useRef([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [showControls, setShowControls] = useState(true);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((event) => {
    if (!transformControlsRef.current) return;
    
    const key = event.key.toLowerCase();
    
    // Handle shortcuts that don't require a selected object
    switch (key) {
      case 'escape':
        if (selectedObject) {
          event.preventDefault();
          setSelectedObject(null);
          transformControlsRef.current.detach();
        }
        return;
    }
    
    // Handle shortcuts that require a selected object
    if (!selectedObject) return;
    
    // Prevent default for our handled keys
    if (['w', 'e', 'r', 'q', 'x', 'y', 'z', ' ', '+', '=', '-'].includes(key)) {
      event.preventDefault();
    }
    
    switch (key) {
      case 'w':
        setTransformMode('translate');
        transformControlsRef.current.setMode('translate');
        break;
      case 'e':
        setTransformMode('rotate');
        transformControlsRef.current.setMode('rotate');
        break;
      case 'r':
        setTransformMode('scale');
        transformControlsRef.current.setMode('scale');
        break;
      case 'q':
        transformControlsRef.current.setSpace(
          transformControlsRef.current.space === 'local' ? 'world' : 'local'
        );
        break;
      case 'x':
        transformControlsRef.current.showX = !transformControlsRef.current.showX;
        break;
      case 'y':
        transformControlsRef.current.showY = !transformControlsRef.current.showY;
        break;
      case 'z':
        transformControlsRef.current.showZ = !transformControlsRef.current.showZ;
        break;
      case ' ':
        transformControlsRef.current.enabled = !transformControlsRef.current.enabled;
        break;
      case '+':
      case '=':
        transformControlsRef.current.setSize(transformControlsRef.current.size * 1.1);
        break;
      case '-':
        transformControlsRef.current.setSize(transformControlsRef.current.size * 0.9);
        break;
    }
  }, [selectedObject]);

  // Mouse click handler for object selection
  const handleClick = useCallback((event) => {
    if (!mindARRef.current || !transformControlsRef.current) return;
    
    const { renderer, scene, camera } = mindARRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersects = raycasterRef.current.intersectObjects(sceneObjectsRef.current, true);
    
    if (intersects.length > 0) {
      let targetObject = intersects[0].object;
      
      // Find the root object with userData
      while (targetObject.parent && !targetObject.userData.isSceneObject) {
        targetObject = targetObject.parent;
      }
      
      if (targetObject.userData.isSceneObject) {
        setSelectedObject(targetObject);
        transformControlsRef.current.attach(targetObject);
        transformControlsRef.current.setMode(transformMode);
        console.log('Selected object:', targetObject.userData.id);
      }
    } else {
      setSelectedObject(null);
      transformControlsRef.current.detach();
    }
  }, [transformMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('AR Viewer starting with:', { mindFile, contentConfig });

    let mixer;
    sceneObjectsRef.current = [];

    const start = async () => {
      try {
        // Check if MindARThree is available
        if (!window.MindARThree) {
          console.error('MindARThree is not available');
          return;
        }

        // Initialize MindAR
        const mindarThree = new window.MindARThree.MindARThree({
          container: containerRef.current,
          imageTargetSrc: mindFile,
        });
        mindARRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Add lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 1);
        scene.add(light);

        // Initialize TransformControls
        const transformControls = new TransformControls(camera, renderer.domElement);
        transformControls.setSize(0.8);
        transformControls.addEventListener('objectChange', () => {
          // Update config when object transforms
          if (selectedObject && contentConfig.sceneObjects) {
            const objId = selectedObject.userData.id;
            const sceneObj = contentConfig.sceneObjects.find(obj => obj.id === objId);
            if (sceneObj) {
              sceneObj.position = {
                x: selectedObject.position.x,
                y: selectedObject.position.y,
                z: selectedObject.position.z
              };
              sceneObj.rotation = {
                x: selectedObject.rotation.x,
                y: selectedObject.rotation.y,
                z: selectedObject.rotation.z
              };
              sceneObj.scale = {
                x: selectedObject.scale.x,
                y: selectedObject.scale.y,
                z: selectedObject.scale.z
              };
            }
          }
        });
        
        scene.add(transformControls);
        transformControlsRef.current = transformControls;

        // Create anchor for the AR content
        const anchor = mindarThree.addAnchor(0);

        // Add 3D content based on scene objects
        if (
          contentConfig.sceneObjects &&
          contentConfig.sceneObjects.length > 0
        ) {
          for (const sceneObject of contentConfig.sceneObjects) {
            const { content } = sceneObject;

            if (content.type === 'model') {
              const loader = new GLTFLoader();
              loader.load(content.url, (gltf) => {
                const model = gltf.scene;

                // Apply transform from scene editor
                model.position.copy(
                  new THREE.Vector3(
                    sceneObject.position.x,
                    sceneObject.position.y,
                    sceneObject.position.z
                  )
                );
                model.rotation.setFromVector3(
                  new THREE.Vector3(
                    sceneObject.rotation.x,
                    sceneObject.rotation.y,
                    sceneObject.rotation.z
                  )
                );
                model.scale.copy(
                  new THREE.Vector3(
                    sceneObject.scale.x,
                    sceneObject.scale.y,
                    sceneObject.scale.z
                  )
                );

                // Mark as scene object for selection
                model.userData = {
                  isSceneObject: true,
                  id: sceneObject.id,
                  type: content.type
                };

                anchor.group.add(model);
                sceneObjectsRef.current.push(model);

                // Handle animations if present
                if (gltf.animations.length > 0) {
                  mixer = new THREE.AnimationMixer(model);
                  const action = mixer.clipAction(gltf.animations[0]);
                  action.play();
                }
              });
            } else if (content.type === 'image') {
              const texture = new THREE.TextureLoader().load(content.url);
              const geometry = new THREE.PlaneGeometry(1, 1);
              const material = new THREE.MeshBasicMaterial({ map: texture });
              const plane = new THREE.Mesh(geometry, material);

              plane.position.copy(
                new THREE.Vector3(
                  sceneObject.position.x,
                  sceneObject.position.y,
                  sceneObject.position.z
                )
              );
              plane.rotation.setFromVector3(
                new THREE.Vector3(
                  sceneObject.rotation.x,
                  sceneObject.rotation.y,
                  sceneObject.rotation.z
                )
              );
              plane.scale.copy(
                new THREE.Vector3(
                  sceneObject.scale.x,
                  sceneObject.scale.y,
                  sceneObject.scale.z
                )
              );

              // Mark as scene object for selection
              plane.userData = {
                isSceneObject: true,
                id: sceneObject.id,
                type: content.type
              };

              anchor.group.add(plane);
              sceneObjectsRef.current.push(plane);
            } else if (content.type === 'video') {
              const video = document.createElement('video');
              video.src = content.url;
              video.load();
              video.loop = true;
              video.muted = true;
              video.crossOrigin = 'anonymous';

              video.addEventListener('loadedmetadata', () => {
                const texture = new THREE.VideoTexture(video);
                const aspectRatio = video.videoWidth / video.videoHeight;
                const geometry = new THREE.PlaneGeometry(aspectRatio > 1 ? 2 : 2 * aspectRatio, aspectRatio > 1 ? 2 / aspectRatio : 2);
                const material = new THREE.MeshBasicMaterial({ map: texture });
                const plane = new THREE.Mesh(geometry, material);

                plane.position.copy(
                  new THREE.Vector3(
                    sceneObject.position.x,
                    sceneObject.position.y,
                    sceneObject.position.z
                  )
                );
                plane.rotation.setFromVector3(
                  new THREE.Vector3(
                    sceneObject.rotation.x,
                    sceneObject.rotation.y,
                    sceneObject.rotation.z
                  )
                );
                plane.scale.copy(
                  new THREE.Vector3(
                    sceneObject.scale.x,
                    sceneObject.scale.y,
                    sceneObject.scale.z
                  )
                );

                plane.userData = {
                  isSceneObject: true,
                  id: sceneObject.id,
                  type: content.type
                };

                anchor.group.add(plane);
                sceneObjectsRef.current.push(plane);

                video.play().catch(console.error);
              });
            } else if (content.type === 'audio') {
              // Create a visual representation for audio
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const context = canvas.getContext('2d');

              if (context) {
                // Fill background
                context.fillStyle = '#4a5568';
                context.fillRect(0, 0, 256, 256);

                // Draw audio icon
                context.fillStyle = '#ffffff';
                context.beginPath();
                context.rect(80, 100, 40, 56);
                context.fill();

                context.beginPath();
                context.moveTo(120, 100);
                context.lineTo(160, 80);
                context.lineTo(160, 176);
                context.lineTo(120, 156);
                context.closePath();
                context.fill();

                context.strokeStyle = '#ffffff';
                context.lineWidth = 3;
                context.beginPath();
                context.arc(140, 128, 20, -0.5, 0.5);
                context.stroke();

                context.beginPath();
                context.arc(140, 128, 30, -0.5, 0.5);
                context.stroke();

                context.beginPath();
                context.arc(140, 128, 40, -0.5, 0.5);
                context.stroke();
              }

              const texture = new THREE.CanvasTexture(canvas);
              const geometry = new THREE.PlaneGeometry(0.5, 0.5);
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
              });
              const audioPlane = new THREE.Mesh(geometry, material);

              audioPlane.position.copy(
                new THREE.Vector3(
                  sceneObject.position.x,
                  sceneObject.position.y,
                  sceneObject.position.z
                )
              );
              audioPlane.rotation.setFromVector3(
                new THREE.Vector3(
                  sceneObject.rotation.x,
                  sceneObject.rotation.y,
                  sceneObject.rotation.z
                )
              );
              audioPlane.scale.copy(
                new THREE.Vector3(
                  sceneObject.scale.x,
                  sceneObject.scale.y,
                  sceneObject.scale.z
                )
              );

              audioPlane.userData = {
                isSceneObject: true,
                id: sceneObject.id,
                type: content.type
              };

              anchor.group.add(audioPlane);
              sceneObjectsRef.current.push(audioPlane);
            } else if (content.type === 'light') {
              const light = new THREE.SpotLight(
                content.color || 0xffffff,
                content.intensity || 1
              );
              
              light.position.copy(
                new THREE.Vector3(
                  sceneObject.position.x,
                  sceneObject.position.y,
                  sceneObject.position.z
                )
              );
              light.rotation.setFromVector3(
                new THREE.Vector3(
                  sceneObject.rotation.x,
                  sceneObject.rotation.y,
                  sceneObject.rotation.z
                )
              );

              light.castShadow = true;
              light.shadow.mapSize.width = 1024;
              light.shadow.mapSize.height = 1024;

              const targetObject = new THREE.Object3D();
              anchor.group.add(targetObject);
              light.target = targetObject;

              // Create light helper for visualization
              const lightHelper = new THREE.SpotLightHelper(light);
              
              light.userData = {
                isSceneObject: true,
                id: sceneObject.id,
                type: content.type
              };

              anchor.group.add(light);
              anchor.group.add(lightHelper);
              sceneObjectsRef.current.push(light);
            }
          }
        }

        // Add event listeners
        containerRef.current.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        // Start AR experience
        await mindarThree.start();

        // Animation loop
        const clock = new THREE.Clock();
        renderer.setAnimationLoop(() => {
          if (mixer) {
            mixer.update(clock.getDelta());
          }
          renderer.render(scene, camera);
        });
      } catch (error) {
        console.error('Error starting AR viewer:', error);
      }
    };

    start().catch(console.error);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
      }
      if (mindARRef.current) {
        mindARRef.current.stop();
      }
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
      }
      sceneObjectsRef.current = [];
      setSelectedObject(null);
    };
  }, [mindFile, contentConfig, handleClick, handleKeyDown]);

  return (
    <div ref={containerRef} className='fixed inset-0 bg-black'>
      {/* Transform Controls Help */}
      {showControls && (
        <div className='fixed top-4 left-4 bg-black/70 text-white p-4 rounded-lg text-sm font-mono z-20 max-w-xs'>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='font-bold'>Transform Controls</h3>
            <button
              onClick={() => setShowControls(false)}
              className='text-gray-300 hover:text-white'
            >
              ×
            </button>
          </div>
          <div className='space-y-1 text-xs'>
            <div><span className='text-yellow-400'>Click</span> object to select</div>
            <div><span className='text-yellow-400'>W</span> translate | <span className='text-yellow-400'>E</span> rotate | <span className='text-yellow-400'>R</span> scale</div>
            <div><span className='text-yellow-400'>Q</span> toggle world/local space</div>
            <div><span className='text-yellow-400'>X/Y/Z</span> toggle axis | <span className='text-yellow-400'>+/-</span> adjust size</div>
            <div><span className='text-yellow-400'>Space</span> toggle enabled | <span className='text-yellow-400'>Esc</span> deselect</div>
          </div>
        </div>
      )}

      {/* Current Selection Info */}
      {selectedObject && (
        <div className='fixed top-4 right-4 bg-black/70 text-white p-4 rounded-lg text-sm z-20'>
          <div className='space-y-2'>
            <div className='font-bold text-blue-400'>
              Selected: {selectedObject.userData.type.charAt(0).toUpperCase() + selectedObject.userData.type.slice(1)}
            </div>
            <div className='text-xs'>
              <div>Mode: <span className='text-green-400'>{transformMode}</span></div>
              <div>ID: <span className='text-gray-400'>{selectedObject.userData.id}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Show Controls Toggle */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className='fixed top-4 left-4 bg-black/70 text-white p-2 rounded-lg hover:bg-black/80 transition-colors z-20'
          title='Show Controls Help'
        >
          ?
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className='fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-100 transition-colors z-10'
      >
        Close AR View
      </button>
    </div>
  );
}
