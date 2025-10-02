import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const applyTransform = (object3D, { position, rotation, scale }) => {
  if (position) {
    object3D.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
  }
  if (rotation) {
    object3D.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0);
  }
  if (scale) {
    object3D.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
  }
};

export function ARViewer({ mindFile, contentConfig, targetsConfig, onClose }) {
  const containerRef = useRef(null);
  const mindARRef = useRef(null);
  const mixersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || !mindFile) return;

    let isCancelled = false;

    const start = async () => {
      if (!window.MindARThree) {
        console.error('MindARThree is not available');
        return;
      }

      const mindarThree = new window.MindARThree.MindARThree({
        container: containerRef.current,
        imageTargetSrc: mindFile,
      });
      mindARRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 1);
      scene.add(hemiLight);

      const loader = new GLTFLoader();
      loader.setCrossOrigin('anonymous');
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');
      const mixers = [];

      const anchorConfigs = Array.isArray(targetsConfig) && targetsConfig.length > 0
        ? targetsConfig
        : [{ sceneObjects: contentConfig?.sceneObjects || [] }];

      const addSceneObjectToAnchor = (anchor, sceneObject = {}) => {
        const { content = {} } = sceneObject;
        const type = content.type;

        if (!type || !content.url) {
          return;
        }

        switch (type) {
          case 'model':
            loader.load(
              content.url,
              (gltf) => {
                if (isCancelled) return;
                const model = gltf.scene;
                applyTransform(model, sceneObject);
                anchor.group.add(model);

                if (gltf.animations && gltf.animations.length > 0) {
                  const mixer = new THREE.AnimationMixer(model);
                  mixers.push(mixer);
                  mixer.clipAction(gltf.animations[0]).play();
                }
              },
              undefined,
              (error) => {
                console.error('Failed to load model', error);
              }
            );
            break;

          case 'image': {
            textureLoader.load(
              content.url,
              (texture) => {
                if (isCancelled) return;
                if ('colorSpace' in texture && THREE.SRGBColorSpace) {
                  texture.colorSpace = THREE.SRGBColorSpace;
                }
                const geometry = new THREE.PlaneGeometry(1, 1);
                const material = new THREE.MeshBasicMaterial({
                  map: texture,
                  transparent: true,
                  side: THREE.DoubleSide,
                });
                const plane = new THREE.Mesh(geometry, material);
                applyTransform(plane, sceneObject);
                anchor.group.add(plane);
              },
              undefined,
              (error) => {
                console.error('Failed to load image texture', error);
              }
            );
            break;
          }

          case 'video': {
            const video = document.createElement('video');
            video.src = content.url;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.autoplay = true;
            video.play().catch((err) => {
              console.warn('Video autoplay failed', err);
            });

            const texture = new THREE.VideoTexture(video);
            if ('colorSpace' in texture && THREE.SRGBColorSpace) {
              texture.colorSpace = THREE.SRGBColorSpace;
            }
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.DoubleSide,
            });
            const plane = new THREE.Mesh(geometry, material);
            applyTransform(plane, sceneObject);
            anchor.group.add(plane);
            break;
          }

          case 'light': {
            const light = new THREE.DirectionalLight(
              content.color || 0xffffff,
              content.intensity ?? 1
            );
            applyTransform(light, sceneObject);
            anchor.group.add(light);
            break;
          }

          default:
            break;
        }
      };

      anchorConfigs.forEach((target, index) => {
        const anchor = mindarThree.addAnchor(index);
        (target.sceneObjects || []).forEach((sceneObject) => {
          addSceneObjectToAnchor(anchor, sceneObject);
        });
      });

      await mindarThree.start();

      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        mixers.forEach((mixer) => mixer.update(delta));
        renderer.render(scene, camera);
      });

      mixersRef.current = mixers;
    };

    start().catch((error) => console.error('Error starting AR viewer:', error));

    return () => {
      isCancelled = true;
      const mixers = mixersRef.current;
      mixers.forEach((mixer) => mixer.stopAllAction?.());
      mixersRef.current = [];

      if (mindARRef.current) {
        mindARRef.current.stop().catch((err) => {
          console.warn('Error stopping MindAR', err);
        });
        mindARRef.current = null;
      }
    };
  }, [mindFile, contentConfig, targetsConfig]);

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
