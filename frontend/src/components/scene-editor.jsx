import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ContentSelector } from './content-selector';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/utils/config.js';
import {
  Move,
  RotateCw,
  Maximize,
  Sun,
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
  Box,
  LampDesk,
  Volume2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Already a full URL
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`; // Convert relative URL to full backend URL
  }
  return url;
};

const loadImageWithDimensions = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Convert to full URL if it's a relative path
    const fullUrl = getFullUrl(url);

    img.onload = () => {
      const texture = new THREE.TextureLoader().load(
        fullUrl,
        () => {
          resolve({
            texture,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        },
        undefined,
        reject
      );
    };

    img.onerror = reject;
    img.src = fullUrl;
  });
};

// Add helper function to create properly scaled geometry
const createImageGeometry = (width, height, maxSize = 2) => {
  // Calculate aspect ratio
  const aspectRatio = width / height;

  let planeWidth, planeHeight;

  if (aspectRatio > 1) {
    // Landscape orientation
    planeWidth = maxSize;
    planeHeight = maxSize / aspectRatio;
  } else {
    // Portrait orientation
    planeWidth = maxSize * aspectRatio;
    planeHeight = maxSize;
  }

  return new THREE.PlaneGeometry(planeWidth, planeHeight);
};

export function SceneEditor({
  markerImage,
  config,
  onChange,
  onMindFileUpload,
  onMarkerImageUpload,
  transformMode,
  uploadedMindFile,
  form,
}) {
  const { toast } = useToast();
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeControlPanel, setActiveControlPanel] = useState(null);
  const [sceneObjects, setSceneObjects] = useState([]);
  const [isSceneInitialized, setIsSceneInitialized] = useState(false);
  const [loadedObjectIds, setLoadedObjectIds] = useState(new Set());

  // Refs
  const containerRef = useRef(null);
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const transformControlsRef = useRef();
  const orbitControlsRef = useRef();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const mindInputRef = useRef(null);
  const markerInputRef = useRef(null);
  const animationFrameRef = useRef();
  const markerPlaneRef = useRef();

  // Track objects being created to prevent duplicates
  const creatingObjectsRef = useRef(new Set());

  // Memoized values
  const sceneObjectsIds = useMemo(
    () => config.sceneObjects?.map((obj) => obj.id) || [],
    [config.sceneObjects]
  );

  // Initialize scene only once
  useEffect(() => {
    if (!containerRef.current || isSceneInitialized) return;

    console.log('Initializing scene...');
    console.log('Container ref:', containerRef.current);
    console.log(
      'Container children before:',
      containerRef.current.children.length
    );

    // CRITICAL: Clear any existing content first
    if (containerRef.current.children.length > 0) {
      console.log('WARNING: Container already has children, clearing...');
      containerRef.current.innerHTML = '';
    }

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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // CRITICAL: Ensure renderer canvas has correct styling
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';

    console.log('Canvas element:', canvas);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

    containerRef.current.appendChild(canvas);
    console.log(
      'Container children after appendChild:',
      containerRef.current.children.length
    );

    rendererRef.current = renderer;

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControlsRef.current = orbitControls;

    const transformControls = new TransformControls(
      camera,
      renderer.domElement
    );
    transformControls.addEventListener('dragging-changed', (event) => {
      orbitControls.enabled = !event.value;
    });

    transformControls.addEventListener('objectChange', () => {
      if (selectedObject) {
        updateSceneConfigOptimized();
      }
    });

    transformControlsRef.current = transformControls;
    scene.add(transformControls);

    // Add static lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Click handler
    const handleClick = (event) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current)
        return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        sceneRef.current.children,
        true
      );

      const clickedObject = intersects.find(({ object }) => {
        if (
          object instanceof THREE.GridHelper ||
          object.parent instanceof TransformControls
        ) {
          return false;
        }
        let current = object;
        while (current) {
          if (current.userData.type === 'content') return true;
          current = current.parent;
        }
        return false;
      })?.object;

      if (clickedObject) {
        let targetObject = clickedObject;
        while (targetObject.parent && !targetObject.userData.type) {
          targetObject = targetObject.parent;
        }
        setSelectedObject(targetObject);
        transformControlsRef.current?.attach(targetObject);
        transformControlsRef.current?.setMode(transformMode);
      } else {
        setSelectedObject(null);
        transformControlsRef.current?.detach();
      }
    };

    containerRef.current.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      orbitControls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }

      if (rendererRef.current) {
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    setIsSceneInitialized(true);

    // Debug: Check what's in the container after initialization
    setTimeout(() => {
      console.log('=== POST-INITIALIZATION DEBUG ===');
      console.log(
        'Container children count:',
        containerRef.current?.children.length
      );
      console.log(
        'Container children:',
        Array.from(containerRef.current?.children || [])
      );
      console.log(
        'First child (should be canvas):',
        containerRef.current?.children[0]
      );
      console.log(
        'First child tag name:',
        containerRef.current?.children[0]?.tagName
      );
      console.log(
        'First child style:',
        containerRef.current?.children[0]?.style.cssText
      );
      console.log('Container style:', containerRef.current?.style.cssText);
      console.log(
        'Container computed style position:',
        getComputedStyle(containerRef.current).position
      );
      console.log('===================================');
    }, 100);

    return () => {
      console.log('Cleaning up scene...');
      console.log(
        'Container children before cleanup:',
        containerRef.current?.children.length
      );

      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('click', handleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (sceneRef.current) {
        sceneRef.current.clear();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (containerRef.current) {
        console.log('Clearing container innerHTML...');
        containerRef.current.innerHTML = '';
        console.log(
          'Container children after cleanup:',
          containerRef.current.children.length
        );
      }

      setIsSceneInitialized(false);
    };
  }, []);

  useEffect(() => {
    if (transformControlsRef.current && selectedObject) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode, selectedObject]);

  useEffect(() => {
    if (!sceneRef.current || !isSceneInitialized) return;

    // Remove existing marker plane
    if (markerPlaneRef.current) {
      sceneRef.current.remove(markerPlaneRef.current);
      markerPlaneRef.current.geometry.dispose();
      markerPlaneRef.current.material.dispose();
    }

    if (markerImage) {
      // Load image with dimensions to maintain aspect ratio
      loadImageWithDimensions(markerImage)
        .then(({ texture, width, height }) => {
          const geometry = createImageGeometry(width, height, 4); // Larger size for marker
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
          });
          const plane = new THREE.Mesh(geometry, material);
          plane.rotation.x = -Math.PI / 2;
          plane.receiveShadow = true;
          markerPlaneRef.current = plane;
          sceneRef.current?.add(plane);
        })
        .catch(console.error);
    }
  }, [markerImage, isSceneInitialized]);

  useEffect(() => {
    if (!sceneRef.current || !isSceneInitialized || !config.sceneObjects)
      return;

    const currentIds = new Set(sceneObjectsIds);
    const loadedIds = loadedObjectIds;

    // Remove objects that are no longer in config
    const objectsToRemove = sceneObjects.filter(
      (obj) => !currentIds.has(obj.userData.id)
    );
    objectsToRemove.forEach((obj) => {
      console.log('Removing object from scene:', obj.userData.id);
      sceneRef.current?.remove(obj);

      // Dispose of geometry and materials to prevent memory leaks
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }

      if (selectedObject === obj) {
        setSelectedObject(null);
        transformControlsRef.current?.detach();
      }
    });

    // Update scene objects state
    const remainingObjects = sceneObjects.filter((obj) =>
      currentIds.has(obj.userData.id)
    );
    setSceneObjects(remainingObjects);

    // Create new objects that aren't loaded yet
    const newObjects = config.sceneObjects.filter(
      (objConfig) => !loadedIds.has(objConfig.id)
    );

    if (newObjects.length > 0) {
      console.log(
        'Creating new objects:',
        newObjects.map((obj) => obj.id)
      );

      newObjects.forEach((objConfig) => {
        // Prevent duplicate creation
        if (!creatingObjectsRef.current.has(objConfig.id)) {
          creatingObjectsRef.current.add(objConfig.id);
          recreateSceneObject(objConfig).finally(() => {
            creatingObjectsRef.current.delete(objConfig.id);
          });
        }
      });
    }

    // Update loaded IDs
    setLoadedObjectIds(currentIds);
  }, [sceneObjectsIds, isSceneInitialized]);

  // Optimized config update function
  const updateSceneConfigOptimized = useCallback(() => {
    if (!selectedObject) return;

    const updatedConfig = {
      ...config,
      sceneObjects: sceneObjects.map((obj) => ({
        id: obj.userData.id,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        content: obj.userData.config.content,
      })),
    };

    onChange(updatedConfig);
    form.setValue('contentConfig', updatedConfig);
  }, [selectedObject, sceneObjects, config, onChange, form]);

  const recreateSceneObject = useCallback(async (sceneObjectConfig) => {
    if (!sceneRef.current || !transformControlsRef.current) return;

    console.log('Recreating scene object:', sceneObjectConfig.id);

    const handleContentLoad = (object) => {
      const sceneObject = object;

      // Ensure the object is properly cleaned from any previous state
      if (sceneObject.parent) {
        sceneObject.parent.remove(sceneObject);
      }

      // Set transform properties
      sceneObject.position.set(
        sceneObjectConfig.position.x,
        sceneObjectConfig.position.y,
        sceneObjectConfig.position.z
      );
      sceneObject.rotation.set(
        sceneObjectConfig.rotation.x,
        sceneObjectConfig.rotation.y,
        sceneObjectConfig.rotation.z
      );
      sceneObject.scale.set(
        sceneObjectConfig.scale.x,
        sceneObjectConfig.scale.y,
        sceneObjectConfig.scale.z
      );

      sceneObject.castShadow = true;
      sceneObject.receiveShadow = true;

      // Set user data
      sceneObject.userData = {
        id: sceneObjectConfig.id,
        type: 'content',
        contentType: sceneObjectConfig.content.type,
        config: {
          position: sceneObjectConfig.position,
          rotation: sceneObjectConfig.rotation,
          scale: sceneObjectConfig.scale,
          content: sceneObjectConfig.content,
        },
      };

      // Handle light-specific properties
      if (sceneObjectConfig.content.type === 'light') {
        const light = sceneObject;
        light.intensity = sceneObjectConfig.content.intensity || 1;
        if (sceneObjectConfig.content.color) {
          light.color.set(sceneObjectConfig.content.color);
        }
      }

      // Add to scene
      sceneRef.current?.add(sceneObject);

      // Update state efficiently
      setSceneObjects((prev) => {
        const existingIndex = prev.findIndex(
          (obj) => obj.userData.id === sceneObjectConfig.id
        );
        if (existingIndex >= 0) {
          sceneRef.current?.remove(prev[existingIndex]);
          const newObjects = [...prev];
          newObjects[existingIndex] = sceneObject;
          console.log(
            'Replaced existing object in state:',
            sceneObjectConfig.id
          );
          return newObjects;
        } else {
          console.log('Added new object to state:', sceneObjectConfig.id);
          return [...prev, sceneObject];
        }
      });

      console.log(
        'Successfully recreated object:',
        sceneObjectConfig.id,
        sceneObjectConfig.content.type
      );
    };

    // Create object based on type
    try {
      if (sceneObjectConfig.content.type === 'light') {
        const light = new THREE.SpotLight(
          0xffffff,
          sceneObjectConfig.content.intensity || 1
        );
        light.position.set(
          sceneObjectConfig.position.x,
          sceneObjectConfig.position.y,
          sceneObjectConfig.position.z
        );
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;

        const targetObject = new THREE.Object3D();
        sceneRef.current?.add(targetObject);
        light.target = targetObject;

        const lightHelper = new THREE.SpotLightHelper(light);
        sceneRef.current?.add(lightHelper);

        handleContentLoad(light);
      } else if (
        sceneObjectConfig.content.type === 'model' &&
        sceneObjectConfig.content.url
      ) {
        const loader = new GLTFLoader();
        loader.load(
          getFullUrl(sceneObjectConfig.content.url),
          (gltf) => {
            const model = gltf.scene.clone();
            handleContentLoad(model);
          },
          undefined,
          (error) => console.error('Error loading model:', error)
        );
      } else if (
        sceneObjectConfig.content.type === 'image' &&
        sceneObjectConfig.content.url
      ) {
        // Load image with proper dimensions
        loadImageWithDimensions(sceneObjectConfig.content.url)
          .then(({ texture, width, height }) => {
            const geometry = createImageGeometry(width, height, 2); // Standard size for content
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              side: THREE.DoubleSide,
              transparent: true,
            });
            const plane = new THREE.Mesh(geometry, material);
            handleContentLoad(plane);
          })
          .catch(console.error);
      } else if (
        sceneObjectConfig.content.type === 'video' &&
        sceneObjectConfig.content.url
      ) {
        // For video, we'll need to load first frame to get dimensions
        const video = document.createElement('video');
        video.src = getFullUrl(sceneObjectConfig.content.url);
        video.load();
        video.loop = true;
        video.muted = true;

        video.addEventListener('loadedmetadata', () => {
          const texture = new THREE.VideoTexture(video);
          const geometry = createImageGeometry(
            video.videoWidth,
            video.videoHeight,
            2
          );
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          const plane = new THREE.Mesh(geometry, material);

          video.play().catch(console.error);
          handleContentLoad(plane);
        });
      } else if (
        sceneObjectConfig.content.type === 'audio' &&
        sceneObjectConfig.content.url
      ) {
        // Create a simple plane with audio icon texture
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
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
        });
        const audioPlane = new THREE.Mesh(geometry, material);
        audioPlane.lookAt(0, 0, 1);

        handleContentLoad(audioPlane);
      }
    } catch (error) {
      console.error('Error creating scene object:', error);
    }
  }, []);

  // Create object function for adding new objects
  const createObject = useCallback(
    async (newConfig) => {
      if (
        !sceneRef.current ||
        !transformControlsRef.current ||
        !isSceneInitialized
      ) {
        console.log('Scene not ready for object creation');
        return;
      }

      console.log('Creating new object with config:', newConfig);

      const objectId = `obj_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Check if already creating this object
      if (creatingObjectsRef.current.has(objectId)) {
        console.log('Object creation already in progress:', objectId);
        return;
      }

      // Add to creation tracking
      creatingObjectsRef.current.add(objectId);

      const handleContentLoad = (object) => {
        try {
          const sceneObject = object;

          if (sceneObject.parent) {
            sceneObject.parent.remove(sceneObject);
          }

          sceneObject.position.set(
            newConfig.position.x,
            newConfig.position.y,
            newConfig.position.z
          );
          sceneObject.rotation.set(
            newConfig.rotation.x,
            newConfig.rotation.y,
            newConfig.rotation.z
          );
          sceneObject.scale.set(
            newConfig.scale.x,
            newConfig.scale.y,
            newConfig.scale.z
          );

          sceneObject.castShadow = true;
          sceneObject.receiveShadow = true;

          sceneObject.userData = {
            id: objectId,
            type: 'content',
            contentType: newConfig.content.type,
            config: {
              ...newConfig,
              content: newConfig.content,
            },
          };

          if (newConfig.content.type === 'light') {
            const light = sceneObject;
            light.intensity = newConfig.content.intensity || 1;
            if (newConfig.content.color) {
              light.color.set(newConfig.content.color);
            }
          }

          const existingInScene = sceneRef.current?.children.find(
            (child) => child.userData?.id === objectId
          );

          if (!existingInScene) {
            sceneRef.current?.add(sceneObject);
            console.log('Added new object to scene:', objectId);
          }

          setSceneObjects((prev) => {
            const existingIndex = prev.findIndex(
              (obj) => obj.userData.id === objectId
            );
            if (existingIndex >= 0) {
              return prev;
            }
            return [...prev, sceneObject];
          });

          setSelectedObject(sceneObject);
          transformControlsRef.current?.attach(sceneObject);
          transformControlsRef.current?.setMode(transformMode);

          const updatedConfig = {
            ...config,
            sceneObjects: [
              ...(config.sceneObjects || []),
              {
                id: objectId,
                position: {
                  x: sceneObject.position.x,
                  y: sceneObject.position.y,
                  z: sceneObject.position.z,
                },
                rotation: {
                  x: sceneObject.rotation.x,
                  y: sceneObject.rotation.y,
                  z: sceneObject.rotation.z,
                },
                scale: {
                  x: sceneObject.scale.x,
                  y: sceneObject.scale.y,
                  z: sceneObject.scale.z,
                },
                content: newConfig.content,
              },
            ],
          };

          onChange(updatedConfig);
          form.setValue('contentConfig', updatedConfig);

          console.log(
            'Object created successfully:',
            objectId,
            newConfig.content.type
          );
        } catch (error) {
          console.error('Error in handleContentLoad:', error);
          handleError(error, 'Failed to process loaded content');
        } finally {
          creatingObjectsRef.current.delete(objectId);
        }
      };

      const handleError = (error, errorMessage) => {
        console.error(errorMessage, error);
        creatingObjectsRef.current.delete(objectId);
        toast({
          title: 'Error creating object',
          description: errorMessage,
          variant: 'destructive',
        });
      };

      // Create object based on type
      try {
        if (newConfig.content.type === 'light') {
          const light = new THREE.SpotLight(
            0xffffff,
            newConfig.content.intensity || 1
          );
          light.position.set(
            newConfig.position.x,
            newConfig.position.y,
            newConfig.position.z
          );
          light.castShadow = true;
          light.shadow.mapSize.width = 1024;
          light.shadow.mapSize.height = 1024;

          const targetObject = new THREE.Object3D();
          sceneRef.current?.add(targetObject);
          light.target = targetObject;

          const lightHelper = new THREE.SpotLightHelper(light);
          sceneRef.current?.add(lightHelper);

          handleContentLoad(light);
        } else if (
          newConfig.content.type === 'model' &&
          newConfig.content.url
        ) {
          console.log('Loading 3D model:', newConfig.content.url);
          const loader = new GLTFLoader();
          loader.load(
            getFullUrl(newConfig.content.url),
            (gltf) => {
              console.log('Model loaded successfully:', newConfig.content.url);
              const model = gltf.scene.clone();
              handleContentLoad(model);
            },
            (progress) => {
              console.log('Loading progress:', progress);
            },
            (error) => {
              handleError(
                error,
                'Failed to load the 3D model. Please try again.'
              );
            }
          );
        } else if (
          newConfig.content.type === 'image' &&
          newConfig.content.url
        ) {
          console.log('Loading image:', newConfig.content.url);
          loadImageWithDimensions(newConfig.content.url)
            .then(({ texture, width, height }) => {
              const geometry = createImageGeometry(width, height, 2);
              const material = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
              });
              const plane = new THREE.Mesh(geometry, material);
              handleContentLoad(plane);
            })
            .catch((error) => {
              handleError(error, 'Failed to load the image. Please try again.');
            });
        } else if (
          newConfig.content.type === 'video' &&
          newConfig.content.url
        ) {
          console.log('Loading video:', newConfig.content.url);
          const video = document.createElement('video');
          video.src = getFullUrl(newConfig.content.url);
          video.load();
          video.loop = true;
          video.muted = true;

          const handleVideoLoad = () => {
            try {
              const texture = new THREE.VideoTexture(video);
              const geometry = createImageGeometry(
                video.videoWidth,
                video.videoHeight,
                2
              );
              const material = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
              });
              const plane = new THREE.Mesh(geometry, material);

              video.play().catch(console.error);
              handleContentLoad(plane);
            } catch (error) {
              handleError(
                error,
                'Failed to process the video. Please try again.'
              );
            }
          };

          video.addEventListener('loadedmetadata', handleVideoLoad);
          video.addEventListener('error', (error) => {
            handleError(error, 'Failed to load the video. Please try again.');
          });
        } else if (
          newConfig.content.type === 'audio' &&
          newConfig.content.url
        ) {
          console.log('Creating audio object:', newConfig.content.url);
          try {
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
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              side: THREE.DoubleSide,
              transparent: true,
            });
            const audioPlane = new THREE.Mesh(geometry, material);
            audioPlane.lookAt(0, 0, 1);

            console.log('Audio visual representation created');
            handleContentLoad(audioPlane);
          } catch (audioError) {
            handleError(
              audioError,
              'Failed to create audio object. Please try again.'
            );
          }
        }
      } catch (error) {
        handleError(error, 'Failed to create the object. Please try again.');
      }
    },
    [config, onChange, form, transformMode, isSceneInitialized, toast]
  );

  // Optimized transform handlers
  const handleTransformChange = useCallback(
    (type, axis, value) => {
      if (!selectedObject) return;

      if (type === 'position') selectedObject.position[axis] = value;
      else if (type === 'rotation') selectedObject.rotation[axis] = value;
      else if (type === 'scale') selectedObject.scale[axis] = value;

      updateSceneConfigOptimized();
    },
    [selectedObject, updateSceneConfigOptimized]
  );

  // Optimized object deletion
  const handleObjectDelete = useCallback(
    (objectToDelete) => {
      if (!sceneRef.current) return;

      console.log('Deleting object:', objectToDelete.userData.id);

      // Remove from scene
      sceneRef.current.remove(objectToDelete);

      // Dispose of resources
      if (objectToDelete instanceof THREE.Mesh) {
        if (objectToDelete.geometry) objectToDelete.geometry.dispose();
        if (objectToDelete.material) {
          if (Array.isArray(objectToDelete.material)) {
            objectToDelete.material.forEach((mat) => mat.dispose());
          } else {
            objectToDelete.material.dispose();
          }
        }
      }

      // Update state
      setSceneObjects((prev) => prev.filter((obj) => obj !== objectToDelete));

      if (selectedObject === objectToDelete) {
        setSelectedObject(null);
        transformControlsRef.current?.detach();
      }

      const updatedConfig = {
        ...config,
        sceneObjects:
          config.sceneObjects?.filter(
            (obj) => obj.id !== objectToDelete.userData.id
          ) || [],
      };

      onChange(updatedConfig);
      form.setValue('contentConfig', updatedConfig);
    },
    [selectedObject, config, onChange, form]
  );

  // Memoized icon function
  const getObjectIcon = useCallback((type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className='h-4 w-4' />;
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'model':
        return <Box className='h-4 w-4' />;
      case 'light':
        return <LampDesk className='h-4 w-4' />;
      case 'audio':
        return <Volume2 className='h-4 w-4' />;
      default:
        return <Box className='h-4 w-4' />;
    }
  }, []);

  return (
    <div className='flex w-full h-full'>
      <input
        type='file'
        accept='.mind'
        style={{ display: 'none' }}
        ref={mindInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onMindFileUpload(file);
        }}
      />
      <input
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        ref={markerInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result;
              if (result) onMarkerImageUpload(result);
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {/* Left Sidebar - Content Selector */}
      <div className='w-64 bg-slate-900 border-r border-slate-700 h-full flex flex-col'>
        {/* Header Section - Fixed */}
        <div className='bg-slate-800 p-4 border-b border-slate-700 flex-shrink-0'>
          <div className='space-y-4'>
            <div>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Title</FormLabel>
                    <Input
                      {...field}
                      placeholder='Experience Title'
                      className='bg-slate-700 border-slate-600 text-white'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white'>Description</FormLabel>
                    <Input
                      {...field}
                      placeholder='Experience Description'
                      className='bg-slate-700 border-slate-600 text-white'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormLabel className='block mb-2 text-white'>Mind File</FormLabel>
              {uploadedMindFile && (
                <p className='text-sm text-gray-100 font-medium truncate bg-slate-700 px-3 py-2 rounded border border-slate-600'>
                  {uploadedMindFile}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Selector - Scrollable */}
        <div className='flex-1 overflow-y-auto'>
          <ContentSelector
            onContentSelect={(content) => {
              const newConfig = {
                position: { x: 0, y: 1, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                content: {
                  ...content,
                  intensity: content.type === 'light' ? 1 : undefined,
                  color: content.type === 'light' ? '#ffffff' : undefined,
                },
              };
              createObject(newConfig);
            }}
            sceneObjects={config.sceneObjects || []}
            onRemoveObject={(id) => {
              const objectToDelete = sceneObjects.find(
                (obj) => obj.userData.id === id
              );
              if (objectToDelete) {
                handleObjectDelete(objectToDelete);
              }
            }}
          />
        </div>
      </div>

      {/* Center - 3D Scene Viewer */}
      <div className='flex-1 bg-slate-800 h-full'>
        <div
          ref={containerRef}
          className='w-full h-full bg-slate-800 relative'
          style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '500px',
          }}
        />
      </div>

      {/* Right Sidebar - Transform Controls */}
      <div className='w-64 bg-slate-800 border-l border-slate-700 h-full flex flex-col'>
        <Card className='h-full bg-slate-800 border-0 rounded-none flex flex-col'>
          {/* Transform Mode Buttons - Fixed */}
          <div className='p-4 border-b border-slate-700 flex-shrink-0'>
            <div className='grid grid-cols-2 gap-2 mb-4'>
              <Button
                variant={
                  activeControlPanel === 'position' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'position' ? null : 'position'
                  )
                }
                className='flex items-center gap-2'
              >
                <Move className='h-4 w-4' />
                <span className='text-xs'>Move</span>
              </Button>
              <Button
                variant={
                  activeControlPanel === 'rotation' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'rotation' ? null : 'rotation'
                  )
                }
                className='flex items-center gap-2'
              >
                <RotateCw className='h-4 w-4' />
                <span className='text-xs'>Rotate</span>
              </Button>
              <Button
                variant={activeControlPanel === 'scale' ? 'default' : 'outline'}
                size='sm'
                onClick={() =>
                  setActiveControlPanel((prev) =>
                    prev === 'scale' ? null : 'scale'
                  )
                }
                className='flex items-center gap-2'
              >
                <Maximize className='h-4 w-4' />
                <span className='text-xs'>Scale</span>
              </Button>
              {selectedObject?.userData.contentType === 'light' && (
                <Button
                  variant={
                    activeControlPanel === 'intensity' ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() =>
                    setActiveControlPanel((prev) =>
                      prev === 'intensity' ? null : 'intensity'
                    )
                  }
                  className='flex items-center gap-2'
                >
                  <Sun className='h-4 w-4' />
                  <span className='text-xs'>Light</span>
                </Button>
              )}
            </div>
          </div>

          {/* Scene Objects List - Scrollable */}
          <div className='p-4 border-b border-slate-700 flex-shrink-0'>
            <Label className='mb-3 block text-white font-medium'>
              Scene Objects
            </Label>
            <div className='space-y-2 max-h-48 overflow-y-auto'>
              {sceneObjects.map((object) => (
                <div
                  key={object.userData.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    selectedObject === object
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => {
                    setSelectedObject(object);
                    transformControlsRef.current?.attach(object);
                  }}
                >
                  <div className='flex items-center gap-3'>
                    {getObjectIcon(object.userData.contentType)}
                    <span className='text-sm text-white font-medium'>
                      {object.userData.contentType.charAt(0).toUpperCase() +
                        object.userData.contentType.slice(1)}
                    </span>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 hover:bg-red-600/20'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleObjectDelete(object);
                    }}
                  >
                    <Trash2 className='h-4 w-4 text-red-400' />
                  </Button>
                </div>
              ))}
              {sceneObjects.length === 0 && (
                <p className='text-sm text-slate-400 text-center py-4 bg-slate-700/50 rounded-md'>
                  {config.sceneObjects?.length
                    ? 'Loading scene objects...'
                    : 'No objects in scene'}
                </p>
              )}
            </div>
          </div>

          {/* Transform Controls - Scrollable */}
          <div className='flex-1 overflow-y-auto p-4'>
            <div
              className={`space-y-6 ${
                !selectedObject ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {activeControlPanel === 'position' && (
                <div className='space-y-4'>
                  <Label className='text-white font-medium'>Position</Label>
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={`position-${axis}`} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <Label className='text-slate-300'>
                          {axis.toUpperCase()}
                        </Label>
                        <span className='text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded'>
                          {Number(selectedObject?.position[axis]).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={-5}
                        max={5}
                        step={0.1}
                        value={[Number(selectedObject?.position[axis] || 0)]}
                        onValueChange={([value]) =>
                          handleTransformChange('position', axis, value)
                        }
                        className='w-full'
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeControlPanel === 'rotation' && (
                <div className='space-y-4'>
                  <Label className='text-white font-medium'>Rotation</Label>
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={`rotation-${axis}`} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <Label className='text-slate-300'>
                          {axis.toUpperCase()}
                        </Label>
                        <span className='text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded'>
                          {(
                            (Number(selectedObject?.rotation[axis] || 0) *
                              180) /
                            Math.PI
                          ).toFixed(0)}
                          °
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={Math.PI * 2}
                        step={0.1}
                        value={[Number(selectedObject?.rotation[axis] || 0)]}
                        onValueChange={([value]) =>
                          handleTransformChange('rotation', axis, value)
                        }
                        className='w-full'
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeControlPanel === 'scale' && (
                <div className='space-y-4'>
                  <Label className='text-white font-medium'>Scale</Label>
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={`scale-${axis}`} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <Label className='text-slate-300'>
                          {axis.toUpperCase()}
                        </Label>
                        <span className='text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded'>
                          {Number(selectedObject?.scale[axis] || 1).toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[Number(selectedObject?.scale[axis] || 1)]}
                        onValueChange={([value]) =>
                          handleTransformChange('scale', axis, value)
                        }
                        className='w-full'
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeControlPanel === 'intensity' &&
                selectedObject?.userData.contentType === 'light' && (
                  <div className='space-y-4'>
                    <Label className='text-white font-medium'>
                      Light Intensity
                    </Label>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <Label className='text-slate-300'>Intensity</Label>
                        <span className='text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded'>
                          {selectedObject.intensity.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={5}
                        step={0.1}
                        value={[selectedObject.intensity]}
                        onValueChange={([value]) => {
                          selectedObject.intensity = value;
                          updateSceneConfigOptimized();
                        }}
                        className='w-full'
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
