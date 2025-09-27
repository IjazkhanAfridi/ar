import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Ensure env vars are loaded for transformation tuning
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Transformation Configuration - IMPROVED FOR ACCURATE POSITIONING
// ---------------------------------------------------------------------------
// Configuration for accurate AR positioning and user-controlled transforms
const POSITION_SCALE = parseFloat(process.env.AR_POSITION_SCALE || '0.5'); // Optimized scale for AR space
const Y_OFFSET_FOR_VISIBILITY = parseFloat(process.env.AR_Y_OFFSET || '0.02'); // Minimum height above marker
const DEBUG_TRANSFORMS = (process.env.AR_DEBUG_TRANSFORMS || 'true').toLowerCase() === 'true'; // Enable transform debugging

// 3D Model specific rotation adjustments (in radians)
const MODEL_ROTATION_OFFSET_X = parseFloat(process.env.AR_MODEL_ROTATION_X || '0'); // Additional X rotation for 3D models
const MODEL_ROTATION_OFFSET_Y = parseFloat(process.env.AR_MODEL_ROTATION_Y || '0'); // Additional Y rotation for 3D models  
const MODEL_ROTATION_OFFSET_Z = parseFloat(process.env.AR_MODEL_ROTATION_Z || '0'); // Additional Z rotation for 3D models

// Enhanced position and scale configuration
const AR_POSITION_SCALE_FACTOR = parseFloat(process.env.AR_POSITION_SCALE_FACTOR || '0.5');
const AR_SCALE_FACTOR_IMAGE = parseFloat(process.env.AR_SCALE_FACTOR_IMAGE || '0.8');
const AR_SCALE_FACTOR_MODEL = parseFloat(process.env.AR_SCALE_FACTOR_MODEL || '0.9');
const AR_SCALE_FACTOR_VIDEO = parseFloat(process.env.AR_SCALE_FACTOR_VIDEO || '0.8');
const AR_USE_MARKER_SCALING = (process.env.AR_USE_MARKER_SCALING || 'true').toLowerCase() === 'true';
const AR_MARKER_BASELINE_SIZE = parseFloat(process.env.AR_MARKER_BASELINE_SIZE || '200');

function transformPlacement(obj, markerDimensions = null) {
  // Original values from the creation experience (frontend sends in radians and AR units)
  let { x, y, z } = obj.position || { x: 0, y: 0, z: 0 };
  let { x: rx, y: ry, z: rz } = obj.rotation || { x: 0, y: 0, z: 0 };
  let { x: sx, y: sy, z: sz } = obj.scale || { x: 1, y: 1, z: 1 };

  if (DEBUG_TRANSFORMS) {
    console.log(`[DEBUG] Original transform for ${obj.content?.type}:`, {
      position: { x, y, z },
      rotation: { rx, ry, rz },
      scale: { sx, sy, sz }
    });
  }

  // ---------------------------------------------------------------------------
  // COORDINATE SYSTEM TRANSFORMATION
  // ---------------------------------------------------------------------------
  // Creation view: Camera at [2,2,2] looking down at [0,0,0]
  // AR view: Camera at [0,0,0] looking forward along Z-axis
  // We need to transform coordinates to maintain the same visual relationship

  // Transform from creation coordinate system to AR coordinate system
  // Creation: Y-up, looking down from above
  // AR: Z-forward, Y-up, looking straight ahead

  // Store original values for reference
  const originalX = x, originalY = y, originalZ = z;
  const originalRx = rx, originalRy = ry, originalRz = rz;

  // ---------------------------------------------------------------------------
  // POSITION TRANSFORMATION - PRESERVE SPATIAL RELATIONSHIPS
  // ---------------------------------------------------------------------------
  // The goal is to maintain the exact spatial relationships from creation view in AR view
  // Creation view has objects positioned in a 3D space that needs to map to AR marker space
  
  // Calculate marker-relative scale based on marker dimensions (if available)
  let markerScale = 1.0;
  if (markerDimensions && markerDimensions.width && markerDimensions.height) {
    // Use marker dimensions to create appropriate scaling
    // Typical marker is ~100-200px, we want objects to fit reasonably in AR space
    const markerSizeInMeters = Math.min(markerDimensions.width, markerDimensions.height) / 1000; // Convert px to approximate meters
    markerScale = Math.max(0.1, Math.min(1.0, markerSizeInMeters)); // Clamp between 0.1 and 1.0
  }
  
  // Apply position scaling that preserves relationships
  // Use configurable scale factor to maintain user-intended positioning
  const AR_POSITION_SCALE = AR_POSITION_SCALE_FACTOR * markerScale; // Use configurable scale
  
  // CRITICAL FIX: Preserve marker-centered coordinate system
  // In creation: (0,0,0) = marker center, user moves objects relative to this center
  // In AR: (0,0,0) = marker center, objects should appear exactly where user placed them
  
  // Apply minimal scaling to fit AR marker space while preserving relationships
  x *= AR_POSITION_SCALE;
  z *= AR_POSITION_SCALE;
  
  // Y-axis: preserve height relationships but ensure objects are above marker surface
  y = (y * AR_POSITION_SCALE) + 0.02; // Preserve Y relationships + small offset above marker
  
  // Marker-based position adjustment if marker dimensions are available
  if (markerDimensions && markerDimensions.width && markerDimensions.height) {
    // Normalize position based on marker aspect ratio to handle rectangular markers properly
    const markerAspect = markerDimensions.width / markerDimensions.height;
    
    if (markerAspect > 1) {
      // Wide marker: scale X positions more
      x *= markerAspect * 0.5;
    } else {
      // Tall marker: scale Z positions more  
      z *= (1 / markerAspect) * 0.5;
    }
  }
  
  if (DEBUG_TRANSFORMS) {
    console.log(`[DEBUG] Position transform for ${obj.content?.type}:`, {
      original: { x: originalX.toFixed(3), y: originalY.toFixed(3), z: originalZ.toFixed(3) },
      scale_factor: AR_POSITION_SCALE.toFixed(3),
      marker_scale: markerScale.toFixed(3),
      transformed: { x: x.toFixed(3), y: y.toFixed(3), z: z.toFixed(3) }
    });
  }

  // ---------------------------------------------------------------------------
  // ROTATION TRANSFORMATION - COORDINATE SYSTEM CONVERSION
  // ---------------------------------------------------------------------------
  // CRITICAL: Transform from creation coordinate system to AR coordinate system
  // 
  // Creation View: Camera at [2,2,2] looking down at [0,0,0]
  //   - Objects face "up" toward the camera (Y+ direction)  
  //   - When user sets "vertical", object faces upward in 3D space
  //
  // AR View: Camera at [0,0,0] looking forward along Z-axis  
  //   - Objects face "forward" toward the camera (Z- direction)
  //   - When user set "vertical" in creation, it should stay vertical in AR
  //
  // Solution: Apply coordinate system transformation matrix

  // The key insight: Creation camera looks down (-Y), AR camera looks forward (+Z)
  // We need to rotate the entire coordinate system by 90° around X-axis
  
  if (DEBUG_TRANSFORMS) {
    console.log(`[DEBUG] Original rotation for ${obj.content?.type}:`, {
      rx_deg: (originalRx * 180/Math.PI).toFixed(1),
      ry_deg: (originalRy * 180/Math.PI).toFixed(1), 
      rz_deg: (originalRz * 180/Math.PI).toFixed(1)
    });
  }
  
  switch (obj.content.type) {
    case 'image':
    case 'video':
      // For media objects, apply coordinate system transformation
      // Creation: user sees from above, AR: user sees from front
      
      // Transform coordinate system: rotate 90° around X to convert Y-up to Z-forward view
      // This maintains the visual appearance the user intended
      
      // Original rotation in creation coordinate system
      // Convert to AR coordinate system by rotating the reference frame
      rx = originalRx + Math.PI/2; // Add 90° to X rotation to convert coordinate systems
      ry = originalRy;             // Y rotation (left/right turn) stays the same
      rz = originalRz;             // Z rotation (roll/tilt) stays the same
      
      // Normalize rotations to [-π, π] range
      while (rx > Math.PI) rx -= 2 * Math.PI;
      while (rx < -Math.PI) rx += 2 * Math.PI;
      
      break;
      
    case 'model':
      // 3D models require the SAME coordinate system transformation as images/videos
      // to maintain the visual orientation that the user set during creation
      
      if (DEBUG_TRANSFORMS) {
        console.log(`[DEBUG] 3D Model original rotation:`, {
          rx_deg: (originalRx * 180/Math.PI).toFixed(1), 
          ry_deg: (originalRy * 180/Math.PI).toFixed(1), 
          rz_deg: (originalRz * 180/Math.PI).toFixed(1)
        });
      }
      
      // Apply the EXACT SAME transformation as images/videos
      // This ensures consistency across all object types
      
      // Transform coordinate system: rotate 90° around X to convert Y-up to Z-forward view
      rx = originalRx + Math.PI/2 + MODEL_ROTATION_OFFSET_X; // Add 90° + any model-specific offset
      ry = originalRy + MODEL_ROTATION_OFFSET_Y;             // Y rotation + any model-specific offset
      rz = originalRz + MODEL_ROTATION_OFFSET_Z;             // Z rotation + any model-specific offset
      
      // Normalize rotations to [-π, π] range
      while (rx > Math.PI) rx -= 2 * Math.PI;
      while (rx < -Math.PI) rx += 2 * Math.PI;
      while (ry > Math.PI) ry -= 2 * Math.PI;
      while (ry < -Math.PI) ry += 2 * Math.PI;
      while (rz > Math.PI) rz -= 2 * Math.PI;
      while (rz < -Math.PI) rz += 2 * Math.PI;
      
      if (DEBUG_TRANSFORMS) {
        console.log(`[DEBUG] 3D Model transformed rotation:`, {
          rx_deg: (rx * 180/Math.PI).toFixed(1), 
          ry_deg: (ry * 180/Math.PI).toFixed(1), 
          rz_deg: (rz * 180/Math.PI).toFixed(1),
          transformation: "Applied +90° X rotation for coordinate system conversion"
        });
      }
      break;
      
    case 'light':
    case 'audio':
    default:
      // For lights, audio, and other objects, preserve exact rotation
      rx = originalRx;
      ry = originalRy; 
      rz = originalRz;
      break;
  }
  
  if (DEBUG_TRANSFORMS) {
    console.log(`[DEBUG] Transformed rotation for ${obj.content?.type}:`, {
      rx_deg: (rx * 180/Math.PI).toFixed(1),
      ry_deg: (ry * 180/Math.PI).toFixed(1),
      rz_deg: (rz * 180/Math.PI).toFixed(1),
      transformation: 'Added +90° to X-axis for coordinate system conversion'
    });
  }

  // ---------------------------------------------------------------------------
  // SCALE TRANSFORMATION - PRESERVE USER-INTENDED SIZING
  // ---------------------------------------------------------------------------
  // The key insight: preserve the relative scale relationships the user created
  // Different object types may need different scale handling
  
  let AR_SCALE_FACTOR;
  
  switch (obj.content.type) {
    case 'image':
      AR_SCALE_FACTOR = AR_SCALE_FACTOR_IMAGE;
      break;
      
    case 'video':
      AR_SCALE_FACTOR = AR_SCALE_FACTOR_VIDEO;
      break;
      
    case 'model':
      AR_SCALE_FACTOR = AR_SCALE_FACTOR_MODEL;
      break;
      
    case 'audio':
      // Audio objects are invisible, scale doesn't matter visually but keep consistent
      AR_SCALE_FACTOR = 1.0;
      break;
      
    default:
      AR_SCALE_FACTOR = AR_SCALE_FACTOR_IMAGE; // Default to image scaling
      break;
  }
  
  // Apply marker-relative scaling if enabled and marker dimensions are available
  if (AR_USE_MARKER_SCALING && markerDimensions && markerDimensions.width && markerDimensions.height) {
    // Adjust scale based on marker size - larger markers can support larger objects
    const markerSizeFactor = Math.min(markerDimensions.width, markerDimensions.height) / AR_MARKER_BASELINE_SIZE;
    AR_SCALE_FACTOR *= Math.max(0.5, Math.min(1.5, markerSizeFactor)); // Clamp between 0.5x and 1.5x
  }
  
  // Store original scale for debugging
  const originalSx = sx, originalSy = sy, originalSz = sz;
  
  // CRITICAL FIX: Use content dimensions for intelligent scaling
  let contentBasedScaling = 1.0;
  
  if (obj.content && obj.content.dimensions && markerDimensions) {
    const contentDims = obj.content.dimensions;
    const markerSize = Math.min(markerDimensions.width, markerDimensions.height);
    const contentSize = Math.max(contentDims.width || 1, contentDims.height || 1);
    
    // Calculate scale factor to make content appropriately sized for marker
    contentBasedScaling = (markerSize * 0.3) / contentSize; // Content should be ~30% of marker size
    contentBasedScaling = Math.max(0.1, Math.min(2.0, contentBasedScaling)); // Clamp to reasonable bounds
    
    if (DEBUG_TRANSFORMS) {
      console.log(`[DEBUG] Content-based scaling for ${obj.content.type}:`, {
        contentSize,
        markerSize,
        contentBasedScaling: contentBasedScaling.toFixed(3)
      });
    }
  }
  
  // Combine base AR scaling with content-based scaling
  const finalScaleFactor = AR_SCALE_FACTOR * contentBasedScaling;
  
  // Apply final scale transformation
  sx *= finalScaleFactor;
  sy *= finalScaleFactor; 
  sz *= finalScaleFactor;
  
  if (DEBUG_TRANSFORMS) {
    console.log(`[DEBUG] Complete transform for ${obj.content?.type}:`, {
      original: { 
        scale: { sx: originalSx.toFixed(3), sy: originalSy.toFixed(3), sz: originalSz.toFixed(3) }
      },
      factors: {
        AR_scale: AR_SCALE_FACTOR.toFixed(3),
        content_based: contentBasedScaling.toFixed(3),
        final: finalScaleFactor.toFixed(3)
      },
      transformed: { 
        scale: { sx: sx.toFixed(3), sy: sy.toFixed(3), sz: sz.toFixed(3) }
      },
      content_dims: obj.content?.dimensions || 'none',
      marker_dims: markerDimensions || 'none'
    });
  }

  // Ensure minimum Y position for visibility
  if (Math.abs(y) < 0.001) {
    y = 0.01; // Small offset above marker
  }

  // Convert radians to degrees for A-Frame (A-Frame expects degrees)
  const rotationXDeg = rx * (180 / Math.PI);
  const rotationYDeg = ry * (180 / Math.PI);
  const rotationZDeg = rz * (180 / Math.PI);

  // Enhanced debug logging with transformation details
  console.log(`[DEBUG] Transform for ${obj.content?.type} (ID: ${obj.id}):`, {
    original: {
      position: { x: originalX.toFixed(3), y: originalY.toFixed(3), z: originalZ.toFixed(3) },
      rotation: { 
        radians: { rx: originalRx.toFixed(3), ry: originalRy.toFixed(3), rz: originalRz.toFixed(3) },
        degrees: { x: (originalRx * 180/Math.PI).toFixed(1), y: (originalRy * 180/Math.PI).toFixed(1), z: (originalRz * 180/Math.PI).toFixed(1) }
      }
    },
    transformed: {
      position: { x: x.toFixed(3), y: y.toFixed(3), z: z.toFixed(3) },
      rotation: { 
        radians: { rx: rx.toFixed(3), ry: ry.toFixed(3), rz: rz.toFixed(3) },
        degrees: { x: rotationXDeg.toFixed(1), y: rotationYDeg.toFixed(1), z: rotationZDeg.toFixed(1) }
      },
      scale: { sx: sx.toFixed(3), sy: sy.toFixed(3), sz: sz.toFixed(3) }
    }
  });

  return {
    positionStr: `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`,
    rotationStr: `${rotationXDeg.toFixed(1)} ${rotationYDeg.toFixed(1)} ${rotationZDeg.toFixed(1)}`,
    scaleStr: `${sx.toFixed(3)} ${sy.toFixed(3)} ${sz.toFixed(3)}`,
  };
}

export function generateExperienceHtml(experience) {
  if (!experience.mindFile) {
    throw new Error('Mind file is required to generate AR experience');
  }
  if (!experience.markerImage) {
    throw new Error('Marker image is required');
  }
  if (
    !experience.contentConfig.sceneObjects ||
    experience.contentConfig.sceneObjects.length === 0
  ) {
    throw new Error('At least one scene object is required');
  }

  console.log('Generating AR experience HTML with enhanced positioning:', {
    id: experience.id,
    title: experience.title,
    mindFile: experience.mindFile,
    sceneObjectsCount: experience.contentConfig.sceneObjects.length,
    mediaTypes: experience.contentConfig.sceneObjects.map(obj => obj.content.type),
    positionScale: POSITION_SCALE,
    yOffset: Y_OFFSET_FOR_VISIBILITY,
    debugMode: DEBUG_TRANSFORMS,
  });

  const assets = experience.contentConfig.sceneObjects
    .map((obj, index) => {
      if (obj.content.type === 'image' && obj.content.url) {
        return `<img id="asset-${obj.id}" src="${obj.content.url}" crossorigin="anonymous" />`;
      }
      if (obj.content.type === 'video' && obj.content.url) {
        return `<video id="asset-${obj.id}" src="${obj.content.url}" loop crossorigin="anonymous" preload="auto"></video>`;
      }
      if (obj.content.type === 'model' && obj.content.url) {
        return `<a-asset-item id="asset-${obj.id}" src="${obj.content.url}"></a-asset-item>`;
      }
      if (obj.content.type === 'audio' && obj.content.url) {
        return `<audio id="asset-${obj.id}" src="${obj.content.url}" preload="auto" loop crossorigin="anonymous"></audio>`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n        ');

  // Extract marker dimensions if available (for better positioning context)
  const markerDimensions = experience.markerDimensions || null;

  const entities = experience.contentConfig.sceneObjects
    .map((obj) => {
      const { positionStr, rotationStr, scaleStr } = transformPlacement(obj, markerDimensions);

      switch (obj.content.type) {
        case 'image':
          return `        <a-image 
          src="#asset-${obj.id}" 
          position="${positionStr}" 
          rotation="${rotationStr}" 
          scale="${scaleStr}"
          side="double"
          crossorigin="anonymous"
          material="transparent: true; alphaTest: 0.1"
        ></a-image>`;

        case 'video':
          return `        <a-video 
          src="#asset-${obj.id}" 
          position="${positionStr}" 
          rotation="${rotationStr}" 
          scale="${scaleStr}"
          autoplay="false"
          loop="true"
          data-video-id="asset-${obj.id}"
          crossorigin="anonymous"
          playsinline
          webkit-playsinline
          material="transparent: true"
        ></a-video>`;

        case 'model':
          return `        <a-entity 
          gltf-model="#asset-${obj.id}" 
          position="${positionStr}" 
          rotation="${rotationStr}" 
          scale="${scaleStr}"
        ></a-entity>`;

        case 'light':
          return `        <a-light 
          type="directional" 
          position="${positionStr}" 
          intensity="${obj.content.intensity || 1}"
          color="${obj.content.color || '#ffffff'}"
        ></a-light>`;

        case 'audio':
          return `        <a-entity 
            id="audio-entity-${obj.id}"
            position="${positionStr}" 
            rotation="${rotationStr}" 
            scale="${scaleStr}"
            visible="false"
            data-audio-id="asset-${obj.id}"
          ></a-entity>`;

        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>AR Experience - ${experience.title}</title>
    <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
    <style>
      body {
        margin: 0;
        overflow: hidden;
        font-family: Arial, sans-serif;
      }
      
      .loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
      }
      
      .controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        display: flex;
        gap: 10px;
      }
      
      .control-btn {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      
      .control-btn:hover {
        background: white;
        transform: scale(1.05);
      }

      .audio-control {
        background: #4CAF50 !important;
        color: white !important;
      }

      .audio-control.muted {
        background: #f44336 !important;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">
      <div>Loading AR Experience...</div>
      <div style="margin-top: 10px; font-size: 14px;">Point your camera at the marker image</div>
    </div>
    
    <a-scene
      mindar-image="imageTargetSrc: ${
        experience.mindFile
      }; filterMinCF:0.0001; filterBeta: 0.01; showStats: false"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
    >
      <a-assets>
        ${assets}
      </a-assets>

      <a-camera 
        position="0 0 0" 
        look-controls="enabled: false" 
        cursor="fuse: false; rayOrigin: mouse"
        fov="80"
        near="0.01"
        far="1000"
      ></a-camera>

      <a-entity mindar-image-target="targetIndex: 0">
        ${entities}
      </a-entity>
    </a-scene>

    <div class="controls">
      ${
        experience.contentConfig.sceneObjects.some(
          (obj) => obj.content.type === 'audio'
        )
          ? '<button id="audioToggle" class="control-btn audio-control">🔊 Sound On</button>'
          : ''
      }
      ${
        experience.contentConfig.sceneObjects.some(
          (obj) => obj.content.type === 'video'
        )
          ? '<button id="videoToggle" class="control-btn video-control">🎬 Video On</button>'
          : ''
      }
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const loading = document.getElementById('loading');
        const scene = document.querySelector('a-scene');
        const audioToggle = document.getElementById('audioToggle');
        const videoToggle = document.getElementById('videoToggle');
        let audioPlaying = false;
        let videoPlaying = false;
        let audioEntities = [];
        let videoEntities = [];

        // Hide loading when AR is ready
        scene.addEventListener('loaded', function() {
          setTimeout(() => {
            if (loading) {
              loading.style.display = 'none';
            }
          }, 2000);
        });

        // Handle AR target found/lost
        const arTarget = document.querySelector('[mindar-image-target]');
        
        if (arTarget) {
          arTarget.addEventListener('targetFound', function() {
            console.log('AR Target found!');
            if (loading) {
              loading.style.display = 'none';
            }
            
            // Auto-play audio if enabled
            if (!audioPlaying && audioEntities.length > 0) {
              playAudios();
            }
            
            // Auto-play video if enabled
            if (!videoPlaying && videoEntities.length > 0) {
              playVideos();
            }
          });

          arTarget.addEventListener('targetLost', function() {
            // Pause all audios and videos when target is lost
            pauseAudios();
            pauseVideos();
          });
        }

        // Initialize audio entities
        function initAudioEntities() {
          const entities = document.querySelectorAll('[data-audio-id]');
          entities.forEach(entity => {
            const audioId = entity.getAttribute('data-audio-id');
            const audioElement = document.getElementById(audioId);
            if (audioElement) {
              audioEntities.push(audioElement);
            }
          });
        }

        // Play all audio
        function playAudios() {
          audioEntities.forEach(audio => {
            audio.play().catch(e => console.log('Audio play failed:', e));
          });
          audioPlaying = true;
          if (audioToggle) {
            audioToggle.textContent = '🔊 Sound On';
            audioToggle.classList.remove('muted');
          }
        }

        // Pause all audio
        function pauseAudios() {
          audioEntities.forEach(audio => {
            audio.pause();
          });
          audioPlaying = false;
        }

        // Mute all audio
        function muteAudios() {
          audioEntities.forEach(audio => {
            audio.muted = true;
          });
          audioPlaying = false;
          if (audioToggle) {
            audioToggle.textContent = '🔇 Sound Off';
            audioToggle.classList.add('muted');
          }
        }

        // Unmute all audio
        function unmuteAudios() {
          audioEntities.forEach(audio => {
            audio.muted = false;
          });
          if (audioToggle) {
            audioToggle.textContent = '🔊 Sound On';
            audioToggle.classList.remove('muted');
          }
        }

        // Initialize video entities
        function initVideoEntities() {
          const entities = document.querySelectorAll('[data-video-id]');
          entities.forEach(entity => {
            const videoId = entity.getAttribute('data-video-id');
            const videoElement = document.getElementById(videoId);
            if (videoElement) {
              videoEntities.push(videoElement);
            }
          });
        }

        // Play all videos
        function playVideos() {
          videoEntities.forEach(video => {
            video.play().catch(e => console.log('Video play failed:', e));
          });
          videoPlaying = true;
          if (videoToggle) {
            videoToggle.textContent = '🎬 Video On';
            videoToggle.classList.remove('muted');
          }
        }

        // Pause all videos
        function pauseVideos() {
          videoEntities.forEach(video => {
            video.pause();
          });
          videoPlaying = false;
        }

        // Mute all videos
        function muteVideos() {
          videoEntities.forEach(video => {
            video.muted = true;
          });
          videoPlaying = false;
          if (videoToggle) {
            videoToggle.textContent = '🎬 Video Off';
            videoToggle.classList.add('muted');
          }
        }

        // Unmute all videos
        function unmuteVideos() {
          videoEntities.forEach(video => {
            video.muted = false;
          });
          if (videoToggle) {
            videoToggle.textContent = '🎬 Video On';
            videoToggle.classList.remove('muted');
          }
        }

        // Initialize audio and video controls
        setTimeout(() => {
          initAudioEntities();
          initVideoEntities();
          
          if (audioToggle && audioEntities.length > 0) {
            audioToggle.addEventListener('click', function() {
              if (audioToggle.classList.contains('muted')) {
                unmuteAudios();
              } else {
                muteAudios();
              }
            });
          }
          
          if (videoToggle && videoEntities.length > 0) {
            videoToggle.addEventListener('click', function() {
              if (videoToggle.classList.contains('muted')) {
                unmuteVideos();
              } else {
                muteVideos();
              }
            });
          }
        }, 1000);

        // Error handling
        window.addEventListener('error', function(e) {
          console.error('AR Experience Error:', e.error);
        });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
        });
      });
    </script>
  </body>
</html>`;

  return html;
}

export function saveExperienceHtml(experience) {
  const html = generateExperienceHtml(experience);

  // Create experiences directory if it doesn't exist
  const experiencesDir = path.join(process.cwd(), 'experiences');
  if (!fs.existsSync(experiencesDir)) {
    fs.mkdirSync(experiencesDir, { recursive: true });
  }

  // Save HTML file
  const filename = `${experience.id}.html`;
  const filePath = path.join(experiencesDir, filename);

  try {
    fs.writeFileSync(filePath, html, 'utf8');
    return `/experiences/${filename}`;
  } catch (error) {
    console.error('Error saving experience HTML:', error);
    throw error;
  }
}

export function generateMultipleImageExperienceHtml(experience) {
  if (!experience.mindFile) {
    throw new Error('Mind file is required to generate AR experience');
  }
  if (!experience.markerImage) {
    throw new Error('Marker image is required');
  }
  if (!experience.targetsConfig || experience.targetsConfig.length === 0) {
    throw new Error('At least one target configuration is required');
  }

  console.log('Generating multiple image HTML for experience:', {
    id: experience.id,
    title: experience.title,
    mindFile: experience.mindFile,
    targetsCount: experience.targetsConfig.length,
  });

  // Collect all assets from all targets
  const allAssets = [];
  const allTargets = [];

  experience.targetsConfig.forEach((target, targetIndex) => {
    const assets = target.sceneObjects
      .map((obj) => {
        const assetId = `target-${targetIndex}-asset-${obj.id}`;
        if (obj.content.type === 'image' && obj.content.url) {
          return `<img id="${assetId}" src="${obj.content.url}" crossorigin="anonymous" />`;
        }
        if (obj.content.type === 'video' && obj.content.url) {
          return `<video id="${assetId}" src="${obj.content.url}" loop muted crossorigin="anonymous"></video>`;
        }
        if (obj.content.type === 'model' && obj.content.url) {
          return `<a-asset-item id="${assetId}" src="${obj.content.url}"></a-asset-item>`;
        }
        if (obj.content.type === 'audio' && obj.content.url) {
          return `<audio id="${assetId}" src="${obj.content.url}" preload="auto" loop crossorigin="anonymous"></audio>`;
        }
        return '';
      })
      .filter(Boolean);

    allAssets.push(...assets);

    const entities = target.sceneObjects
      .map((obj) => {
        const assetId = `target-${targetIndex}-asset-${obj.id}`;
        // Apply the same transform logic for consistent top-down view
        const { positionStr, rotationStr, scaleStr } = transformPlacement(obj);

        switch (obj.content.type) {
          case 'image':
            return `        <a-image 
            src="#${assetId}" 
            position="${positionStr}" 
            rotation="${rotationStr}" 
            scale="${scaleStr}"
            side="double"
            crossorigin="anonymous"
          ></a-image>`;

          case 'video':
            return `        <a-video 
            src="#${assetId}" 
            position="${positionStr}" 
            rotation="${rotationStr}" 
            scale="${scaleStr}"
            autoplay="true"
            data-video-id="${assetId}"
            crossorigin="anonymous"
            playsinline
            webkit-playsinline
          ></a-video>`;

          case 'model':
            return `        <a-entity 
            gltf-model="#${assetId}" 
            position="${positionStr}" 
            rotation="${rotationStr}" 
            scale="${scaleStr}"
          ></a-entity>`;

          case 'light':
            return `        <a-light 
            type="directional" 
            position="${positionStr}" 
            intensity="${obj.content.intensity || 1}"
            color="${obj.content.color || '#ffffff'}"
          ></a-light>`;

          case 'audio':
            return `        <a-entity 
              id="audio-entity-${assetId}"
              position="${positionStr}" 
              rotation="${rotationStr}" 
              scale="${scaleStr}"
              visible="false"
              data-audio-id="${assetId}"
            ></a-entity>`;

          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    allTargets.push(`      <a-entity mindar-image-target="targetIndex: ${targetIndex}">
${entities}
      </a-entity>`);
  });

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>AR Experience - ${experience.title}</title>
    <script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
    <style>
      body {
        margin: 0;
        overflow: hidden;
        font-family: Arial, sans-serif;
      }
      
      .loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
      }
      
      .controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        display: flex;
        gap: 10px;
      }
      
      .control-btn {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      
      .control-btn:hover {
        background: white;
        transform: scale(1.05);
      }

      .audio-control {
        background: #4CAF50 !important;
        color: white !important;
      }

      .audio-control.muted {
        background: #f44336 !important;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">
      <div>Loading AR Experience...</div>
      <div style="margin-top: 10px; font-size: 14px;">Point your camera at any marker image</div>
    </div>
    
    <a-scene
      mindar-image="imageTargetSrc: ${
        experience.mindFile
      }; filterMinCF:0.0001; filterBeta: 0.01; showStats: false"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
    >
      <a-assets>
        ${allAssets.join('\n        ')}
      </a-assets>

      <a-camera 
        position="0 0 0" 
        look-controls="enabled: false" 
        cursor="fuse: false; rayOrigin: mouse"
        fov="80"
        near="0.01"
        far="1000"
      ></a-camera>

${allTargets.join('\n\n')}
    </a-scene>

    <div class="controls">
      <button id="audioToggle" class="control-btn audio-control">🔊 Sound On</button>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const loading = document.getElementById('loading');
        const scene = document.querySelector('a-scene');
        const audioToggle = document.getElementById('audioToggle');
        let audioPlaying = false;
        let audioEntities = [];

        // Hide loading when AR is ready
        scene.addEventListener('loaded', function() {
          setTimeout(() => {
            if (loading) {
              loading.style.display = 'none';
            }
          }, 2000);
        });

        // Handle AR targets
        const arTargets = document.querySelectorAll('[mindar-image-target]');
        
        arTargets.forEach((target, index) => {
          target.addEventListener('targetFound', function() {
            console.log('AR Target', index, 'found!');
            if (loading) {
              loading.style.display = 'none';
            }
          });

          target.addEventListener('targetLost', function() {
          });
        });

        // Initialize audio entities
        function initAudioEntities() {
          const entities = document.querySelectorAll('[data-audio-id]');
          entities.forEach(entity => {
            const audioId = entity.getAttribute('data-audio-id');
            const audioElement = document.getElementById(audioId);
            if (audioElement) {
              audioEntities.push(audioElement);
            }
          });
        }

        // Audio controls
        function muteAudios() {
          audioEntities.forEach(audio => {
            audio.muted = true;
          });
          if (audioToggle) {
            audioToggle.textContent = '🔇 Sound Off';
            audioToggle.classList.add('muted');
          }
        }

        function unmuteAudios() {
          audioEntities.forEach(audio => {
            audio.muted = false;
          });
          if (audioToggle) {
            audioToggle.textContent = '🔊 Sound On';
            audioToggle.classList.remove('muted');
          }
        }

        // Initialize
        setTimeout(() => {
          initAudioEntities();
          
          if (audioToggle && audioEntities.length > 0) {
            audioToggle.addEventListener('click', function() {
              if (audioToggle.classList.contains('muted')) {
                unmuteAudios();
              } else {
                muteAudios();
              }
            });
          } else if (audioToggle) {
            audioToggle.style.display = 'none';
          }
        }, 1000);

        // Error handling
        window.addEventListener('error', function(e) {
          console.error('Multiple Image AR Experience Error:', e.error);
        });

        // Prevent context menu
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
        });
      });
    </script>
  </body>
</html>`;

  return html;
}

export function saveMultipleImageExperienceHtml(experience) {
  const html = generateMultipleImageExperienceHtml(experience);

  // Create experiences directory if it doesn't exist
  const experiencesDir = path.join(process.cwd(), 'experiences');
  if (!fs.existsSync(experiencesDir)) {
    fs.mkdirSync(experiencesDir, { recursive: true });
  }

  // Save HTML file
  const filename = `${experience.id}.html`;
  const filePath = path.join(experiencesDir, filename);

  try {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Multiple image experience HTML saved: ${filename}`);
    return `/experiences/${filename}`;
  } catch (error) {
    console.error('Error saving multiple image experience HTML:', error);
    throw error;
  }
}
