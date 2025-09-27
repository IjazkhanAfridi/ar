import { useRef, useEffect, useState, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/stores/sceneStore';

const FiberScene = ({ markerImage }) => {
  const { camera, gl } = useThree();
  const orbitControlsRef = useRef();
  const transformControlsRef = useRef();
  const { selectedObject, transformMode, sceneObjects } = useSceneStore();

  // Handle keyboard shortcuts for transform modes
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedObject || !transformControlsRef.current) return;

      switch (event.key.toLowerCase()) {
        case 'g':
          useSceneStore.getState().setTransformMode('translate');
          break;
        case 'r':
          useSceneStore.getState().setTransformMode('rotate');
          break;
        case 's':
          useSceneStore.getState().setTransformMode('scale');
          break;
        case 'escape':
          useSceneStore.getState().setSelectedObject(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  // Update transform controls mode
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Handle transform controls interaction
  const handleTransformStart = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  };

  const handleTransformEnd = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  };

  // Handle transform change
  const handleTransformChange = () => {
    if (selectedObject && selectedObject.userData?.id) {
      const transform = {
        position: {
          x: selectedObject.position.x,
          y: selectedObject.position.y,
          z: selectedObject.position.z,
        },
        rotation: {
          x: selectedObject.rotation.x,
          y: selectedObject.rotation.y,
          z: selectedObject.rotation.z,
        },
        scale: {
          x: selectedObject.scale.x,
          y: selectedObject.scale.y,
          z: selectedObject.scale.z,
        },
      };
      useSceneStore.getState().updateObjectTransform(selectedObject.userData.id, transform);
    }
  };

  // Handle clicking on empty space to deselect
  const handleBackgroundClick = () => {
    if (selectedObject) {
      useSceneStore.getState().setSelectedObject(null);
    }
  };

  return (
    <>
      {/* Background plane for deselection */}
      <mesh
        onClick={handleBackgroundClick}
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <hemisphereLight intensity={0.8} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Grid */}
      <Grid 
        args={[10, 10]} 
        cellColor="#6f6f6f" 
        sectionColor="#9d4b4b" 
        fadeDistance={25} 
        fadeStrength={1}
      />

      {/* Orbit Controls */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        screenSpacePanning={false}
        minDistance={1}
        maxDistance={100}
        maxPolarAngle={Math.PI}
      />

      {/* Transform Controls */}
      {selectedObject && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedObject}
          mode={transformMode}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          onChange={handleTransformChange}
          size={1}
          showX={true}
          showY={true}
          showZ={true}
        />
      )}

      {/* Marker Image Plane */}
      {markerImage && (
        <MarkerImagePlane markerImage={markerImage} />
      )}

      {/* Render all scene objects */}
      {sceneObjects.map((sceneObject) => (
        <SceneObjectMesh
          key={sceneObject.id}
          sceneObject={sceneObject}
          onSelect={(object) => {
            useSceneStore.getState().setSelectedObject(object);
          }}
        />
      ))}
    </>
  );
};

// Marker Image Plane Component
const MarkerImagePlane = ({ markerImage }) => {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (markerImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const textureLoader = new THREE.TextureLoader();
        const loadedTexture = textureLoader.load(markerImage);
        setTexture(loadedTexture);
        
        // Calculate aspect ratio for proper sizing
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const maxSize = 2;
        
        let planeWidth, planeHeight;
        if (aspectRatio > 1) {
          planeWidth = maxSize;
          planeHeight = maxSize / aspectRatio;
        } else {
          planeWidth = maxSize * aspectRatio;
          planeHeight = maxSize;
        }
        
        setDimensions({ width: planeWidth, height: planeHeight });
      };
      img.src = markerImage;
    }
  }, [markerImage]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[dimensions.width, dimensions.height]} />
      <meshBasicMaterial map={texture} transparent opacity={0.8} />
    </mesh>
  );
};

// Scene Object Mesh Component
const SceneObjectMesh = ({ sceneObject, onSelect }) => {
  const meshRef = useRef();
  const { content } = sceneObject;

  // Handle click selection
  const handleClick = (event) => {
    event.stopPropagation();
    if (meshRef.current) {
      meshRef.current.userData = { id: sceneObject.id, type: 'content' };
      onSelect(meshRef.current);
    }
  };

  // Apply transform from scene object
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        sceneObject.position.x,
        sceneObject.position.y,
        sceneObject.position.z
      );
      meshRef.current.rotation.set(
        sceneObject.rotation.x,
        sceneObject.rotation.y,
        sceneObject.rotation.z
      );
      meshRef.current.scale.set(
        sceneObject.scale.x,
        sceneObject.scale.y,
        sceneObject.scale.z
      );
    }
  }, [sceneObject.position, sceneObject.rotation, sceneObject.scale]);

  // Render based on content type
  if (content.type === 'model') {
    return (
      <ModelMesh
        ref={meshRef}
        url={content.url}
        onClick={handleClick}
        sceneObject={sceneObject}
      />
    );
  } else if (content.type === 'image') {
    return (
      <ImageMesh
        ref={meshRef}
        url={content.url}
        onClick={handleClick}
        sceneObject={sceneObject}
      />
    );
  } else if (content.type === 'primitive') {
    return (
      <PrimitiveMesh
        ref={meshRef}
        primitiveType={content.primitiveType}
        onClick={handleClick}
        sceneObject={sceneObject}
      />
    );
  }

  return null;
};

// Model Mesh Component using useGLTF from drei
const ModelMesh = forwardRef(({ url, onClick, sceneObject }, ref) => {
  const { scene } = useGLTF(url);

  return (
    <primitive
      ref={ref}
      object={scene.clone()}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
    />
  );
});

// Image Mesh Component
const ImageMesh = forwardRef(({ url, onClick, sceneObject }, ref) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(url, (loadedTexture) => {
      setTexture(loadedTexture);
    });
  }, [url]);

  if (!texture) return null;

  return (
    <mesh
      ref={ref}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
});

// Primitive Mesh Component
const PrimitiveMesh = forwardRef(({ primitiveType, onClick, sceneObject }, ref) => {
  const getGeometry = () => {
    switch (primitiveType) {
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'plane':
        return <planeGeometry args={[1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh
      ref={ref}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
    >
      {getGeometry()}
      <meshStandardMaterial color="#888888" />
    </mesh>
  );
});

export default FiberScene;
