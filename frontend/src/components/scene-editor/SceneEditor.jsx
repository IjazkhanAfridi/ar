import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { Canvas3D } from './Canvas3D';
import { useThreeScene } from './useThreeScene';
import { useSceneObjects } from './useSceneObjects';
import { loadImageWithDimensions, createImageGeometry } from './helpers';

export function SceneEditor({
  markerImage,
  config,
  onChange,
  onMindFileUpload,
  onMarkerImageUpload,
  transformMode,
  uploadedMindFile,
  form
}) {
  const { containerRef, scene, transformControls, selectedObject, setSelectedObject, initialized } =
    useThreeScene(transformMode, () => syncConfigFromScene());
  const { sceneObjects, createObject, deleteObject, syncConfigFromScene } = useSceneObjects({
    config,
    sceneRef: scene,
    initialized,
    transformControlsRef: transformControls,
    onConfigChange: onChange,
    form
  });

  const [activePanel, setActivePanel] = useState(null);
  const mindInputRef = useRef(null);
  const markerInputRef = useRef(null);
  const markerPlaneRef = useRef();

  // Marker plane handling
  useEffect(() => {
    if (!initialized || !scene.current) return;
    if (markerPlaneRef.current) {
      scene.current.remove(markerPlaneRef.current);
      markerPlaneRef.current.geometry.dispose();
      markerPlaneRef.current.material.dispose();
      markerPlaneRef.current = null;
    }
    if (markerImage) {
      loadImageWithDimensions(markerImage)
        .then(({ texture, width, height }) => {
          const geometry = createImageGeometry(width, height, 4);
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
          });
          const plane = new THREE.Mesh(geometry, material);
          plane.rotation.x = -Math.PI / 2;
          plane.receiveShadow = true;
          markerPlaneRef.current = plane;
          scene.current.add(plane);
        })
        .catch(console.error);
    }
  }, [markerImage, initialized, scene]);

  const handleDeleteObj = useCallback(
    (obj) => deleteObject(obj.userData.id),
    [deleteObject]
  );

  const transformSync = useCallback(() => {
    syncConfigFromScene();
  }, [syncConfigFromScene]);

  return (
    <div className='flex w-full h-full'>
      <SidebarLeft
        form={form}
        uploadedMindFile={uploadedMindFile}
        onMindFileUpload={(f) => onMindFileUpload(f)}
        onMarkerImageUpload={(m) => onMarkerImageUpload(m)}
        onAddContent={(c) => createObject(c)}
        sceneObjects={config.sceneObjects || []}
        onRemoveObject={(id) => deleteObject(id)}
        mindInputRef={mindInputRef}
        markerInputRef={markerInputRef}
      />
      <div className='flex-1 bg-slate-800 h-full'>
        <Canvas3D containerRef={containerRef} />
      </div>
      <SidebarRight
        selectedObject={selectedObject}
        setSelectedObject={setSelectedObject}
        objects={sceneObjects}
        onDeleteObject={handleDeleteObj}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onTransformSync={transformSync}
      />
    </div>
  );
}