import * as THREE from 'three';
import { API_BASE_URL } from '@/utils/config.js';

export const getFullUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url;
};

export const loadImageWithDimensions = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const fullUrl = getFullUrl(url);
    img.onload = () => {
      const texture = new THREE.TextureLoader().load(
        fullUrl,
        () => resolve({ texture, width: img.naturalWidth, height: img.naturalHeight }),
        undefined,
        reject
      );
    };
    img.onerror = reject;
    img.src = fullUrl;
  });

export const createImageGeometry = (width, height, maxSize = 2) => {
  const aspect = width / height;
  let w, h;
  if (aspect > 1) {
    w = maxSize;
    h = maxSize / aspect;
  } else {
    w = maxSize * aspect;
    h = maxSize;
  }
  return new THREE.PlaneGeometry(w, h);
};