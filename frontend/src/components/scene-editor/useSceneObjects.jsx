import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadImageWithDimensions, createImageGeometry, getFullUrl } from './helpers.jsx';

export function useSceneObjects({
  config,
  sceneRef,
  initialized,
  transformControlsRef,
  onConfigChange,
  form
}) {
  const [sceneObjects, setSceneObjects] = useState([]);
  const [loadedIds, setLoadedIds] = useState(new Set());
  const creatingRef = useRef(new Set());

  const syncConfigFromScene = useCallback(() => {
    const updated = {
      ...config,
      sceneObjects: sceneObjects.map((o) => ({
        id: o.userData.id,
        position: { x: o.position.x, y: o.position.y, z: o.position.z },
        rotation: { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z },
        scale: { x: o.scale.x, y: o.scale.y, z: o.scale.z },
        content: o.userData.config.content
      }))
    };
    onConfigChange(updated);
    form.setValue('contentConfig', updated);
  }, [sceneObjects, config, onConfigChange, form]);

  const recreateObject = useCallback(async (objConfig) => {
    if (!sceneRef.current || !transformControlsRef.current) return;
    const scene = sceneRef.current;

    const finalize = (object) => {
      object.position.set(objConfig.position.x, objConfig.position.y, objConfig.position.z);
      object.rotation.set(objConfig.rotation.x, objConfig.rotation.y, objConfig.rotation.z);
      object.scale.set(objConfig.scale.x, objConfig.scale.y, objConfig.scale.z);
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData = {
        id: objConfig.id,
        type: 'content',
        contentType: objConfig.content.type,
        config: objConfig
      };
      scene.add(object);
      setSceneObjects((prev) => {
        const i = prev.findIndex((p) => p.userData.id === objConfig.id);
        if (i >= 0) {
          const copy = [...prev];
            scene.remove(prev[i]);
          copy[i] = object;
          return copy;
        }
        return [...prev, object];
      });
    };

    try {
      if (objConfig.content.type === 'light') {
        const light = new THREE.SpotLight(0xffffff, objConfig.content.intensity || 1);
        light.castShadow = true;
        finalize(light);
      } else if (objConfig.content.type === 'model' && objConfig.content.url) {
        new GLTFLoader().load(getFullUrl(objConfig.content.url), (gltf) => {
          finalize(gltf.scene.clone());
        });
      } else if (objConfig.content.type === 'image' && objConfig.content.url) {
        const { texture, width, height } = await loadImageWithDimensions(objConfig.content.url);
        const mesh = new THREE.Mesh(
          createImageGeometry(width, height, 2),
          new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
        );
        finalize(mesh);
      } else if (objConfig.content.type === 'video' && objConfig.content.url) {
        const video = document.createElement('video');
        video.src = getFullUrl(objConfig.content.url);
        video.loop = true;
        video.muted = true;
        video.addEventListener('loadedmetadata', () => {
          const texture = new THREE.VideoTexture(video);
            const mesh = new THREE.Mesh(
            createImageGeometry(video.videoWidth, video.videoHeight, 2),
            new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
          );
          video.play().catch(()=>{});
          finalize(mesh);
        });
      } else if (objConfig.content.type === 'audio') {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4a5568'; ctx.fillRect(0,0,256,256);
        ctx.fillStyle = '#fff'; ctx.fillRect(80,100,40,56);
        const tex = new THREE.CanvasTexture(canvas);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5,0.5),
          new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, transparent: true })
        );
        finalize(mesh);
      }
    } catch (e) {
      console.error('Error recreating object', e);
    }
  }, [sceneRef, transformControlsRef]);

  // Sync when config changes
  useEffect(() => {
    if (!initialized || !config.sceneObjects) return;
    const desiredIds = new Set(config.sceneObjects.map(o => o.id));
    // Remove
    setSceneObjects(prev => {
      prev.forEach(o => {
        if (!desiredIds.has(o.userData.id)) sceneRef.current?.remove(o);
      });
      return prev.filter(o => desiredIds.has(o.userData.id));
    });
    // Add new
    config.sceneObjects.forEach(objConfig => {
      if (!loadedIds.has(objConfig.id) && !creatingRef.current.has(objConfig.id)) {
        creatingRef.current.add(objConfig.id);
        recreateObject(objConfig).finally(() => {
          creatingRef.current.delete(objConfig.id);
          setLoadedIds(new Set(config.sceneObjects.map(o=>o.id)));
        });
      }
    });
  }, [config.sceneObjects, initialized, loadedIds, recreateObject, sceneRef]);

  const createObject = useCallback((baseConfig) => {
    const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const newConfig = {
      id,
      ...baseConfig
    };
    const updated = {
      ...config,
      sceneObjects: [...(config.sceneObjects || []), newConfig]
    };
    onConfigChange(updated);
    form.setValue('contentConfig', updated);
  }, [config, onConfigChange, form]);

  const deleteObject = useCallback((id) => {
    setSceneObjects(prev => {
      const target = prev.find(o => o.userData.id === id);
      if (target) {
        sceneRef.current?.remove(target);
        if (target.geometry) target.geometry.dispose();
        if (target.material) {
          if (Array.isArray(target.material)) target.material.forEach(m => m.dispose());
          else target.material.dispose();
        }
      }
      return prev.filter(o => o.userData.id !== id);
    });
    const updated = {
      ...config,
      sceneObjects: (config.sceneObjects || []).filter(o => o.id !== id)
    };
    onConfigChange(updated);
    form.setValue('contentConfig', updated);
  }, [config, onConfigChange, form, sceneRef]);

  return {
    sceneObjects,
    createObject,
    deleteObject,
    syncConfigFromScene
  };
}