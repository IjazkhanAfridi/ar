import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function ARViewer({ mindFile, contentConfig, onClose }) {
  const containerRef = useRef(null);
  const mindARRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('AR Viewer starting with:', { mindFile, contentConfig });

    let mixer;

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

                anchor.group.add(model);

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

              anchor.group.add(plane);
            }
          }
        }

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
      if (mindARRef.current) {
        mindARRef.current.stop();
      }
    };
  }, [mindFile, contentConfig]);

  return (
    <div ref={containerRef} className='fixed inset-0 bg-black'>
      <button
        onClick={onClose}
        className='fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-100 transition-colors z-10'
      >
        Close AR View
      </button>
    </div>
  );
}
