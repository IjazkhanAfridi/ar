import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const defaultSceneConfig = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  sceneObjects: [],
};

const SceneConfigContext = createContext(undefined);

export const SceneConfigProvider = ({ children }) => {
  const [sceneConfig, setSceneConfig] = useState(defaultSceneConfig);

  const addSceneObject = (object) => {
    setSceneConfig(prev => ({
      ...prev,
      sceneObjects: [...prev.sceneObjects, object],
    }));
  };

  const removeSceneObject = (id) => {
    setSceneConfig(prev => ({
      ...prev,
      sceneObjects: prev.sceneObjects.filter(obj => obj.id !== id),
    }));
  };

  const updateSceneObject = (id, updates) => {
    setSceneConfig(prev => ({
      ...prev,
      sceneObjects: prev.sceneObjects.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
  };

  const resetSceneConfig = () => {
    setSceneConfig(defaultSceneConfig);
  };

  return (
    <SceneConfigContext.Provider
      value={{
        sceneConfig,
        setSceneConfig,
        addSceneObject,
        removeSceneObject,
        updateSceneObject,
        resetSceneConfig,
      }}
    >
      {children}
    </SceneConfigContext.Provider>
  );
};

// PropTypes for runtime type checking
const Vector3PropType = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  z: PropTypes.number.isRequired,
});

const SceneObjectContentPropType = PropTypes.shape({
  type: PropTypes.oneOf(['image', 'video', 'model', 'light', 'audio']).isRequired,
  url: PropTypes.string,
  intensity: PropTypes.number,
  color: PropTypes.string,
});

const SceneObjectPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  position: Vector3PropType.isRequired,
  rotation: Vector3PropType.isRequired,
  scale: Vector3PropType.isRequired,
  content: SceneObjectContentPropType.isRequired,
});

const SceneConfigPropType = PropTypes.shape({
  position: Vector3PropType.isRequired,
  rotation: Vector3PropType.isRequired,
  scale: Vector3PropType.isRequired,
  sceneObjects: PropTypes.arrayOf(SceneObjectPropType).isRequired,
});

SceneConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSceneConfig = () => {
  const context = useContext(SceneConfigContext);
  if (context === undefined) {
    throw new Error('useSceneConfig must be used within a SceneConfigProvider');
  }
  return context;
};

// Export PropTypes for use in other components
export {
  Vector3PropType,
  SceneObjectContentPropType,
  SceneObjectPropType,
  SceneConfigPropType,
};