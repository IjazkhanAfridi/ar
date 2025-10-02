const DEFAULT_SCENE_CONFIG = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  sceneObjects: [],
};

const coerceVector3 = (value = {}, fallback = { x: 0, y: 0, z: 0 }) => ({
  x: Number(value?.x ?? fallback.x ?? 0),
  y: Number(value?.y ?? fallback.y ?? 0),
  z: Number(value?.z ?? fallback.z ?? 0),
});

const sanitizeContent = (content = {}) => {
  if (!content || typeof content !== 'object') {
    return {};
  }

  const { meshRef, file, ...rest } = content;
  return { ...rest };
};

export const sanitizeSceneObjects = (objects = []) => {
  if (!Array.isArray(objects)) {
    return [];
  }

  return objects
    .filter(Boolean)
    .map((obj) => ({
  id: obj?.id ?? `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      position: coerceVector3(obj?.position),
      rotation: coerceVector3(obj?.rotation),
      scale: coerceVector3(obj?.scale, { x: 1, y: 1, z: 1 }),
      content: sanitizeContent(obj?.content),
    }));
};

export const ensureSceneConfig = (config) => ({
  position: coerceVector3(config?.position, DEFAULT_SCENE_CONFIG.position),
  rotation: coerceVector3(config?.rotation, DEFAULT_SCENE_CONFIG.rotation),
  scale: coerceVector3(config?.scale, DEFAULT_SCENE_CONFIG.scale),
  sceneObjects: sanitizeSceneObjects(config?.sceneObjects || []),
});

export const sanitizeTargets = (targets = []) => {
  if (!Array.isArray(targets)) {
    return [];
  }

  return targets
    .filter(Boolean)
    .map((target, index) => ({
      id: target?.id || `target-${index}`,
      name: target?.name || `Target ${index + 1}`,
      markerImage: target?.markerImage || '',
      markerDimensions: (() => {
        if (!target?.markerDimensions) return null;
        if (typeof target.markerDimensions === 'string') {
          try {
            return JSON.parse(target.markerDimensions);
          } catch (error) {
            console.warn('Failed to parse markerDimensions, ignoring.', error);
            return null;
          }
        }
        return target.markerDimensions;
      })(),
      sceneObjects: sanitizeSceneObjects(target?.sceneObjects || []),
    }));
};
