import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/stores/sceneStore';
import { API_BASE_URL } from '@/utils/config.js';

// Error Boundary for React Three Fiber
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Three.js Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-slate-800 text-white">
          <div className="text-center">
            <h2>Something went wrong with the 3D scene.</h2>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

// Scene component that works inside Canvas
function Scene({ 
  sceneObjects, 
  selectedObject, 
  setSelectedObject, 
  transformMode, 
  onObjectChange,
  markerImage 
}) {
  const { camera, gl } = useThree();
  const orbitControlsRef = useRef();
  const transformControlsRef = useRef();

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
    // Trigger update when transform ends
    if (onObjectChange) {
      onObjectChange();
    }
  };

  // Handle clicking on empty space to deselect
  const handleBackgroundClick = () => {
    if (selectedObject) {
      setSelectedObject(null);
    }
  };

  // Update transform controls mode
  useEffect(() => {
    if (transformControlsRef.current && selectedObject) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Update transform controls when selected object changes
  useEffect(() => {
    if (transformControlsRef.current) {
      if (selectedObject) {
        transformControlsRef.current.attach(selectedObject);
      } else {
        transformControlsRef.current.detach();
      }
    }
  }, [selectedObject]);

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

      {/* Orbit Controls */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.05}
        screenSpacePanning={false}
        minDistance={1}
        maxDistance={100}
        maxPolarAngle={Math.PI}
      />

      {/* Transform Controls - Only show when object is selected */}
      {selectedObject && (
        <TransformControls
          ref={transformControlsRef}
          mode={transformMode}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          onChange={handleTransformEnd}
          size={1}
          showX={true}
          showY={true}
          showZ={true}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <hemisphereLight args={[0xffffff, 0x444444, 0.8]} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Grid */}
      <gridHelper args={[10, 10]} />

      {/* Marker Image Plane */}
      {markerImage && (
        <MarkerPlane markerImage={markerImage} />
      )}

      {/* Render all scene objects */}
      {sceneObjects.map((obj) => (
        <SceneObject
          key={obj.id}
          sceneObject={obj}
          onSelect={setSelectedObject}
          isSelected={selectedObject === obj.meshRef?.current}
        />
      ))}
    </>
  );
}

// Component for marker image plane
function MarkerPlane({ markerImage }) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (markerImage) {
      const loader = new THREE.TextureLoader();
      loader.load(markerImage, setTexture);
    }
  }, [markerImage]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={texture} transparent opacity={0.5} />
    </mesh>
  );
}

// Component for individual scene objects
function SceneObject({ sceneObject, onSelect, isSelected }) {
  const meshRef = useRef();
  const { content, position, rotation, scale } = sceneObject;

  // Handle click selection
  const handleClick = (event) => {
    event.stopPropagation();
    if (meshRef.current) {
      onSelect(meshRef.current);
    }
  };

  // Update position when object changes and store ref
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, position.y, position.z);
      meshRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
      meshRef.current.scale.set(scale.x, scale.y, scale.z);
      
      // Store reference in scene object for external access
      sceneObject.meshRef = meshRef;
    }
  });

  return (
    <Suspense fallback={<LoadingBox ref={meshRef} onClick={handleClick} />}>
      {content.type === 'model' && (
        <ModelObject ref={meshRef} content={content} onClick={handleClick} />
      )}
      {content.type === 'image' && (
        <ImageObject ref={meshRef} content={content} onClick={handleClick} />
      )}
      {content.type === 'video' && (
        <VideoObject ref={meshRef} content={content} onClick={handleClick} />
      )}
      {content.type === 'primitive' && (
        <PrimitiveObject ref={meshRef} content={content} onClick={handleClick} />
      )}
      {content.type === 'light' && (
        <LightObject ref={meshRef} content={content} onClick={handleClick} />
      )}
      {content.type === 'audio' && (
        <AudioObject ref={meshRef} content={content} onClick={handleClick} />
      )}
    </Suspense>
  );
}

// Loading placeholder component
const LoadingBox = React.forwardRef(({ onClick }, ref) => (
  <mesh ref={ref} onClick={onClick}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="gray" wireframe />
  </mesh>
));

// Individual object type components
const ModelObject = React.forwardRef(({ content, onClick }, ref) => {
  const fullUrl = getFullUrl(content.url);
  
  console.log('ModelObject loading:', content.url, '→', fullUrl);
  
  const { scene } = useGLTF(fullUrl);
  
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

const ImageObject = React.forwardRef(({ content, onClick }, ref) => {
  const [texture, setTexture] = useState(null);
  const fullUrl = getFullUrl(content.url);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(fullUrl, setTexture);
  }, [fullUrl]);

  return (
    <mesh ref={ref} onClick={onClick}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
});

const VideoObject = React.forwardRef(({ content, onClick }, ref) => {
  const [video, setVideo] = useState(null);
  const [texture, setTexture] = useState(null);
  const fullUrl = getFullUrl(content.url);

  useEffect(() => {
    const videoElement = document.createElement('video');
    videoElement.src = fullUrl;
    videoElement.crossOrigin = 'anonymous';
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.play();
    
    const videoTexture = new THREE.VideoTexture(videoElement);
    setVideo(videoElement);
    setTexture(videoTexture);
  }, [fullUrl]);

  return (
    <mesh ref={ref} onClick={onClick}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
});

const PrimitiveObject = React.forwardRef(({ content, onClick }, ref) => {
  const getGeometry = () => {
    switch (content.primitiveType) {
      case 'box':
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
    <mesh ref={ref} onClick={onClick}>
      {getGeometry()}
      <meshStandardMaterial color={content.color || 0x888888} />
    </mesh>
  );
});

const LightObject = React.forwardRef(({ content, onClick }, ref) => {
  // Lights don't have mesh, so we'll create a helper object
  return (
    <group ref={ref} onClick={onClick}>
      <pointLight
        intensity={content.intensity || 1}
        color={content.color || 0xffffff}
        distance={content.distance || 0}
      />
      {/* Visual helper */}
      <mesh>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color={0xffff00} />
      </mesh>
    </group>
  );
});

const AudioObject = React.forwardRef(({ content, onClick }, ref) => {
  // Audio sources need a visual representation
  return (
    <mesh ref={ref} onClick={onClick}>
      <sphereGeometry args={[0.2]} />
      <meshStandardMaterial color={0x00ff00} />
    </mesh>
  );
});

// Main R3F Scene Container
export function R3FSceneContainer({ 
  sceneObjects, 
  selectedObject, 
  setSelectedObject, 
  transformMode, 
  onObjectChange,
  markerImage,
  className 
}) {
  return (
    <div className={className}>
      <ErrorBoundary>
        <Canvas
          camera={{ position: [2, 2, 2], fov: 75, near: 0.1, far: 1000 }}
          gl={{ 
            antialias: true, 
            alpha: false, 
            preserveDrawingBuffer: false,
            shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap }
          }}
          style={{ background: 'white' }}
          onError={(error) => {
            console.error('Canvas error:', error);
          }}
        >
          <Scene
            sceneObjects={sceneObjects}
            selectedObject={selectedObject}
            setSelectedObject={setSelectedObject}
            transformMode={transformMode}
            onObjectChange={onObjectChange}
            markerImage={markerImage}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
