import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
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
  const { camera, gl, scene } = useThree();
  const orbitControlsRef = useRef();
  const transformControlsRef = useRef();
  const updateTimeoutRef = useRef();

  // Set scene background to white
  useEffect(() => {
    scene.background = new THREE.Color(0xffffff); // White background
  }, [scene]);

  // Handle transform controls interaction
  const handleTransformStart = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  };

  // Handle real-time transform changes (while dragging) with throttling
  const handleTransformChange = () => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Throttle updates to avoid too many rapid calls
    updateTimeoutRef.current = setTimeout(() => {
      if (selectedObject && selectedObject.mesh && selectedObject.sceneObj) {
        const mesh = selectedObject.mesh;
        
        const updatedSceneObj = {
          ...selectedObject.sceneObj,
          position: {
            x: Number(mesh.position.x.toFixed(3)),
            y: Number(mesh.position.y.toFixed(3)),
            z: Number(mesh.position.z.toFixed(3))
          },
          rotation: {
            x: Number(mesh.rotation.x.toFixed(3)),
            y: Number(mesh.rotation.y.toFixed(3)),
            z: Number(mesh.rotation.z.toFixed(3))
          },
          scale: {
            x: Number(mesh.scale.x.toFixed(3)),
            y: Number(mesh.scale.y.toFixed(3)),
            z: Number(mesh.scale.z.toFixed(3))
          }
        };
        
        // Update the scene object in the parent component
        if (onObjectChange) {
          onObjectChange(updatedSceneObj);
        }
      }
    }, 50); // 50ms throttle
  };

  const handleTransformEnd = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
    
    // Clear throttle timeout and do immediate final update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Final update when transform ends
    if (selectedObject && selectedObject.mesh && selectedObject.sceneObj) {
      const mesh = selectedObject.mesh;
      const updatedSceneObj = {
        ...selectedObject.sceneObj,
        position: {
          x: Number(mesh.position.x.toFixed(3)),
          y: Number(mesh.position.y.toFixed(3)),
          z: Number(mesh.position.z.toFixed(3))
        },
        rotation: {
          x: Number(mesh.rotation.x.toFixed(3)),
          y: Number(mesh.rotation.y.toFixed(3)),
          z: Number(mesh.rotation.z.toFixed(3))
        },
        scale: {
          x: Number(mesh.scale.x.toFixed(3)),
          y: Number(mesh.scale.y.toFixed(3)),
          z: Number(mesh.scale.z.toFixed(3))
        }
      };
      
      // Update the scene object in the parent component
      if (onObjectChange) {
        onObjectChange(updatedSceneObj);
      }
    }
  };

  // Handle clicking on empty space to deselect (but not when transform controls are being used)
  const handleBackgroundClick = (event) => {
    // Disable automatic deselection - selection should persist
    // Users can manually deselect by clicking a "Clear Selection" button if needed
    return;
  };

  // Update transform controls mode
  useEffect(() => {
    if (transformControlsRef.current && selectedObject) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Update transform controls when selected object changes
  useEffect(() => {
    const attachControls = () => {
      if (transformControlsRef.current && selectedObject?.mesh) {
        transformControlsRef.current.attach(selectedObject.mesh);
        
        // Ensure controls are enabled and visible
        transformControlsRef.current.enabled = true;
        transformControlsRef.current.visible = true;
      } else if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
    };

    // Add a small delay to ensure the mesh is fully initialized
    if (selectedObject?.mesh) {
      const timeout = setTimeout(attachControls, 100);
      return () => clearTimeout(timeout);
    } else {
      attachControls();
    }
  }, [selectedObject]);

  return (
    <>
      {/* Background plane for deselection - but only when explicitly clicking to deselect */}
      <mesh
        onClick={handleBackgroundClick}
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
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
      {selectedObject?.mesh && (
        <TransformControls
          ref={transformControlsRef}
          mode={transformMode}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          onChange={handleTransformChange}
          size={1}
          showX={true}
          showY={true}
          showZ={true}
          space="world"
          translationSnap={null}
          rotationSnap={null}
          scaleSnap={null}
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
          onSelect={(mesh, sceneObj) => setSelectedObject({ mesh, sceneObj })}
          isSelected={selectedObject?.sceneObj?.id === obj.id}
        />
      ))}
    </>
  );
}

// Component for marker image plane
function MarkerPlane({ markerImage }) {
  const [texture, setTexture] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 2, height: 2 });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (markerImage) {
      console.log('MarkerPlane: Loading marker image:', markerImage);
      const loader = new THREE.TextureLoader();
      
      // Create an Image element to get original dimensions
      const img = new Image();
      
      img.onload = () => {
        console.log('MarkerPlane: Image loaded successfully');
        // Calculate aspect ratio and scale appropriately
        const aspectRatio = img.width / img.height;
        const maxSize = 3; // Maximum dimension for the marker
        
        let width, height;
        if (aspectRatio > 1) {
          // Landscape
          width = maxSize;
          height = maxSize / aspectRatio;
        } else {
          // Portrait or square
          height = maxSize;
          width = maxSize * aspectRatio;
        }
        
        setImageDimensions({ width, height });
        
        // Load the texture
        loader.load(
          markerImage, 
          (loadedTexture) => {
            console.log('MarkerPlane: Texture loaded successfully');
            setTexture(loadedTexture);
            setLoadError(false);
          },
          undefined,
          (error) => {
            console.error('MarkerPlane: Error loading texture:', error);
            setLoadError(true);
          }
        );
      };
      
      img.onerror = (error) => {
        console.error('MarkerPlane: Error loading image:', error);
        setLoadError(true);
      };
      
      // Add credentials for cross-origin requests
      img.crossOrigin = 'anonymous';
      img.src = markerImage;
    }
  }, [markerImage]);

  if (loadError) {
    console.log('MarkerPlane: Showing fallback due to load error');
    return (
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="red" transparent={true} opacity={0.3} />
      </mesh>
    );
  }

  if (!texture) return null;

  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[imageDimensions.width, imageDimensions.height]} />
      <meshBasicMaterial map={texture} transparent={false} opacity={1.0} />
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
      onSelect(meshRef.current, sceneObject);
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
  }, [position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, scale.x, scale.y, scale.z]);

  return (
    <Suspense fallback={null}>
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

// Individual object type components
const ModelObject = React.forwardRef(({ content, onClick }, ref) => {
  const fullUrl = getFullUrl(content.url);
  
  const { scene } = useGLTF(fullUrl);
  
  // Clone the scene to avoid modifying the original
  const clonedScene = scene.clone();
  
  // Find the first mesh in the scene for transform controls
  const findFirstMesh = (object) => {
    if (object.isMesh) return object;
    for (const child of object.children) {
      const mesh = findFirstMesh(child);
      if (mesh) return mesh;
    }
    return null;
  };
  
  // Use a group as the transform target that contains the model
  return (
    <group
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
      <primitive object={clonedScene} />
    </group>
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
