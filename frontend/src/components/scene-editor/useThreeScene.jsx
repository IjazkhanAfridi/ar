import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export function useThreeScene(transformMode, onObjectTransform) {
  const containerRef = useRef(null);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const orbitControlsRef = useRef();
  const transformControlsRef = useRef();
  const animationRef = useRef();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [initialized, setInitialized] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  // Stable ref for external transform callback
  const objectTransformRef = useRef(onObjectTransform);
  useEffect(() => {
    objectTransformRef.current = onObjectTransform;
  }, [onObjectTransform]);

  useEffect(() => {
    if (!containerRef.current || initialized) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbitControlsRef.current = orbit;

    const transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', (e) => {
      orbit.enabled = !e.value;
    });
    transform.addEventListener('objectChange', () => {
      if (selectedObject && objectTransformRef.current) {
        objectTransformRef.current(selectedObject);
      }
    });
    transformControlsRef.current = transform;
    // Add only once
    scene.add(transform);

    // Lights & helpers
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    dir.castShadow = true;
    scene.add(dir);
    scene.add(new THREE.GridHelper(10, 10));

    const handleClick = (event) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      const pick = intersects.find(({ object }) => {
        if (object instanceof THREE.GridHelper) return false;
        if (object.parent === transform) return false;
        let cur = object;
        while (cur) {
          if (cur.userData.type === 'content') return true;
          cur = cur.parent;
        }
        return false;
      })?.object;

      if (pick) {
        let root = pick;
        while (root.parent && !root.userData.type) root = root.parent;
        if (root !== selectedObject) {
          setSelectedObject(root);
          transform.attach(root);
          transform.setMode(modeFromTransform(transformMode));
        }
      } else if (selectedObject) {
        setSelectedObject(null);
        transform.detach();
      }
    };
    containerRef.current.addEventListener('click', handleClick);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    setInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('click', handleClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      transform.dispose?.();
      orbit.dispose?.();
      renderer.dispose();
      scene.clear();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      setInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]); // removed selectedObject / transformMode / callback to prevent re-inits

  // Just update mode when transformMode changes
  useEffect(() => {
    if (transformControlsRef.current && selectedObject) {
      transformControlsRef.current.setMode(modeFromTransform(transformMode));
    }
  }, [transformMode, selectedObject]);

  return {
    containerRef,
    scene: sceneRef,
    camera: cameraRef,
    renderer: rendererRef,
    transformControls: transformControlsRef,
    selectedObject,
    setSelectedObject,
    initialized
  };
}

function modeFromTransform(mode) {
  if (mode === 'translate' || mode === 'position') return 'translate';
  if (mode === 'rotate' || mode === 'rotation') return 'rotate';
  if (mode === 'scale') return 'scale';
  return 'translate';
}