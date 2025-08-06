import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  console.log('Generating HTML for experience:', {
    id: experience.id,
    title: experience.title,
    mindFile: experience.mindFile,
    sceneObjectsCount: experience.contentConfig.sceneObjects.length,
    audioCount: experience.contentConfig.sceneObjects.filter(
      (obj) => obj.content.type === 'audio'
    ).length,
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

  const entities = experience.contentConfig.sceneObjects
    .map((obj) => {
      const position = `${obj.position.x} ${obj.position.y} ${obj.position.z}`;
      const rotation = `${obj.rotation.x} ${obj.rotation.y} ${obj.rotation.z}`;
      const scale = `${obj.scale.x} ${obj.scale.y} ${obj.scale.z}`;

      switch (obj.content.type) {
        case 'image':
          return `        <a-image 
          src="#asset-${obj.id}" 
          position="${position}" 
          rotation="${rotation}" 
          scale="${scale}"
        ></a-image>`;

        case 'video':
          return `        <a-video 
          src="#asset-${obj.id}" 
          position="${position}" 
          rotation="${rotation}" 
          scale="${scale}"
          autoplay="true"
          data-video-id="asset-${obj.id}"
        ></a-video>`;

        case 'model':
          return `        <a-entity 
          gltf-model="#asset-${obj.id}" 
          position="${position}" 
          rotation="${rotation}" 
          scale="${scale}"
        ></a-entity>`;

        case 'light':
          return `        <a-light 
          type="directional" 
          position="${position}" 
          intensity="${obj.content.intensity || 1}"
          color="${obj.content.color || '#ffffff'}"
        ></a-light>`;

        case 'audio':
          return `        <a-entity 
            id="audio-entity-${obj.id}"
            position="${position}" 
            rotation="${rotation}" 
            scale="${scale}"
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

      <a-camera position="0 0 0" look-controls="enabled: false" cursor="fuse: false; rayOrigin: mouse"></a-camera>

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
          console.log('AR Scene loaded');
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
            console.log('AR Target lost!');
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
    console.log(`Experience HTML saved: ${filename}`);
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
        const position = `${obj.position.x} ${obj.position.y} ${obj.position.z}`;
        const rotation = `${obj.rotation.x} ${obj.rotation.y} ${obj.rotation.z}`;
        const scale = `${obj.scale.x} ${obj.scale.y} ${obj.scale.z}`;

        switch (obj.content.type) {
          case 'image':
            return `        <a-image 
            src="#${assetId}" 
            position="${position}" 
            rotation="${rotation}" 
            scale="${scale}"
          ></a-image>`;

          case 'video':
            return `        <a-video 
            src="#${assetId}" 
            position="${position}" 
            rotation="${rotation}" 
            scale="${scale}"
            autoplay="true"
          ></a-video>`;

          case 'model':
            return `        <a-entity 
            gltf-model="#${assetId}" 
            position="${position}" 
            rotation="${rotation}" 
            scale="${scale}"
          ></a-entity>`;

          case 'light':
            return `        <a-light 
            type="directional" 
            position="${position}" 
            intensity="${obj.content.intensity || 1}"
            color="${obj.content.color || '#ffffff'}"
          ></a-light>`;

          case 'audio':
            return `        <a-entity 
              id="audio-entity-${assetId}"
              position="${position}" 
              rotation="${rotation}" 
              scale="${scale}"
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

      <a-camera position="0 0 0" look-controls="enabled: false" cursor="fuse: false; rayOrigin: mouse"></a-camera>

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
          console.log('Multiple Image AR Scene loaded');
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
            console.log('AR Target', index, 'lost!');
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
