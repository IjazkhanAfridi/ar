import { create } from 'zustand';
import * as THREE from 'three';

export const useSceneStore = create((set, get) => ({
  // Scene objects management
  sceneObjects: [],
  selectedObject: null,
  transformMode: 'translate',
  
  // Scene configuration that matches the existing structure
  sceneConfig: {
    position: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    sceneObjects: [],
  },

  // Add object to scene with smart positioning to prevent overlap
  addSceneObject: (objectData) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Get current state to calculate positioning
    const currentObjects = get().sceneObjects;
    const objectCount = currentObjects.length;
    
    // CRITICAL FIX: Always place new objects at marker center (0,0,0)
    // This ensures all objects start at the exact center of the marker image
    const getDefaultPosition = () => {
      return {
        x: 0, // Center of marker horizontally
        y: 0.5, // Slightly above marker surface 
        z: 0, // Center of marker depth-wise
      };
    };
    
    const newObject = {
      id,
      ...objectData,
      position: objectData.position || getDefaultPosition(),
      rotation: objectData.rotation || { x: 0, y: 0, z: 0 },
      scale: objectData.scale || { x: 1, y: 1, z: 1 },
    };
    
    set((state) => {
      const updatedSceneObjects = [...state.sceneObjects, newObject];
      const updatedConfig = {
        ...state.sceneConfig,
        sceneObjects: updatedSceneObjects,
      };
      
      return {
        sceneObjects: updatedSceneObjects,
        sceneConfig: updatedConfig,
      };
    });
    
    return id;
  },

  // Remove object from scene
  removeSceneObject: (id) => {
    set((state) => {
      const updatedSceneObjects = state.sceneObjects.filter(obj => obj.id !== id);
      const updatedConfig = {
        ...state.sceneConfig,
        sceneObjects: updatedSceneObjects,
      };
      
      return {
        sceneObjects: updatedSceneObjects,
        sceneConfig: updatedConfig,
        selectedObject: state.selectedObject?.userData?.id === id ? null : state.selectedObject,
      };
    });
  },

  // Update object transform
  updateObjectTransform: (id, transform) => {
    set((state) => {
      const updatedSceneObjects = state.sceneObjects.map(obj => 
        obj.id === id ? { ...obj, ...transform } : obj
      );
      const updatedConfig = {
        ...state.sceneConfig,
        sceneObjects: updatedSceneObjects,
      };
      
      return {
        sceneObjects: updatedSceneObjects,
        sceneConfig: updatedConfig,
      };
    });
  },

  // Set selected object
  setSelectedObject: (object) => {
    set({ selectedObject: object });
  },

  // Set transform mode
  setTransformMode: (mode) => {
    set({ transformMode: mode });
  },

  // Update scene configuration (for compatibility with existing form)
  updateSceneConfig: (config) => {
    set({ sceneConfig: config });
  },

  // Load scene objects from existing configuration
  loadSceneObjects: (sceneObjects) => {
    set((state) => ({
      sceneObjects: sceneObjects || [],
      sceneConfig: {
        ...state.sceneConfig,
        sceneObjects: sceneObjects || [],
      },
    }));
  },

  // Clear scene
  clearScene: () => {
    set({
      sceneObjects: [],
      selectedObject: null,
      sceneConfig: {
        position: { x: 0, y: 0, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        sceneObjects: [],
      },
    });
  },

  // Get scene config for form submission (maintains compatibility)
  getSceneConfigForSubmission: () => {
    const state = get();
    return {
      position: state.sceneConfig.position,
      rotation: state.sceneConfig.rotation,
      scale: state.sceneConfig.scale,
      sceneObjects: state.sceneObjects,
    };
  },
}));
