import dotenv from 'dotenv';
dotenv.config();
import { generateExperienceHtml } from './src/utils/experienceGenerator.js';

// Test data - simulating an experience object
const testExperience = {
  id: 'test-topdown',
  title: 'Top Down Test Experience',
  mindFile: '/uploads/mind-files/test.mind',
  markerImage: '/uploads/test-marker.jpg',
  contentConfig: {
    sceneObjects: [
      {
        id: 'test-image-1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        content: {
          type: 'image',
          url: '/uploads/test-image.jpg'
        }
      },
      {
        id: 'test-model-1', 
        position: { x: 1, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        content: {
          type: 'model',
          url: '/uploads/test-model.glb'
        }
      }
    ]
  }
};

console.log('Testing top-down view HTML generation...');
try {
  const html = generateExperienceHtml(testExperience);
  
  // Look for rotation values in the output
  const rotationMatches = html.match(/rotation="[^"]*"/g);
  console.log('\nRotation values found:');
  rotationMatches?.forEach(match => console.log(match));
  
  // Show the entity parts
  const entityMatch = html.match(/<a-entity mindar-image-target[\s\S]*?<\/a-entity>/);
  if (entityMatch) {
    console.log('\nGenerated entities:');
    console.log(entityMatch[0]);
  }
} catch (error) {
  console.error('Error:', error.message);
}