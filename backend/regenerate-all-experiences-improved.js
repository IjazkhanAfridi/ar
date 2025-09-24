#!/usr/bin/env node

import { db } from './src/config/database.js';
import { experiences } from './src/models/schema.js';
import { saveExperienceHtml, saveMultipleImageExperienceHtml } from './src/utils/experienceGenerator.js';
import { desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Regenerate all AR experience HTML files with improved positioning system
 * This script updates all experiences to use the new accurate positioning transforms
 */

async function regenerateAllExperiences() {
  try {
    console.log('🔄 Starting regeneration of all AR experiences...\n');
    
    // Get all experiences
    const allExperiences = await db
      .select()
      .from(experiences)
      .orderBy(desc(experiences.createdAt));
    
    console.log(`📊 Found ${allExperiences.length} experiences to regenerate\n`);
    
    if (allExperiences.length === 0) {
      console.log('❌ No experiences found to regenerate');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each experience
    for (const experience of allExperiences) {
      try {
        console.log(`🔧 Processing Experience ID: ${experience.id} - "${experience.title}"`);
        
        // Check if it's a multiple image experience
        if (experience.isMultipleTargets) {
          const htmlPath = await saveMultipleImageExperienceHtml(experience);
          console.log(`✅ Multiple image experience HTML generated: ${htmlPath}`);
        } else {
          // Regular single image experience
          const htmlPath = await saveExperienceHtml(experience);
          console.log(`✅ Experience HTML generated: ${htmlPath}`);
        }
        
        successCount++;
        
        // Log positioning data for verification
        if (experience.contentConfig?.sceneObjects?.length > 0) {
          console.log(`   📍 Scene objects: ${experience.contentConfig.sceneObjects.length}`);
          experience.contentConfig.sceneObjects.forEach((obj, index) => {
            console.log(`      ${index + 1}. ${obj.content.type} - Position: (${obj.position.x}, ${obj.position.y}, ${obj.position.z}) Scale: (${obj.scale.x}, ${obj.scale.y}, ${obj.scale.z})`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Error processing Experience ID ${experience.id}:`, error.message);
        errors.push({
          id: experience.id,
          title: experience.title,
          error: error.message
        });
        errorCount++;
      }
      
      console.log(''); // Add spacing
    }

    // Final summary
    console.log('🎯 REGENERATION COMPLETE!');
    console.log('========================');
    console.log(`✅ Successfully regenerated: ${successCount} experiences`);
    console.log(`❌ Failed to regenerate: ${errorCount} experiences`);
    
    if (errors.length > 0) {
      console.log('\n💥 ERRORS ENCOUNTERED:');
      errors.forEach(error => {
        console.log(`   - ID ${error.id} (${error.title}): ${error.error}`);
      });
    }
    
    console.log('\n🔧 NEW FEATURES APPLIED:');
    console.log('   ✓ 1:1 position scaling for accurate placement');
    console.log('   ✓ Preserved user-defined rotations and scales');
    console.log('   ✓ Top-down view enforcement for images');
    console.log('   ✓ Marker dimension awareness');
    console.log('   ✓ Precise transform calculations');
    
    // Check experiences directory
    const experiencesDir = path.join(process.cwd(), 'experiences');
    if (fs.existsSync(experiencesDir)) {
      const htmlFiles = fs.readdirSync(experiencesDir).filter(file => file.endsWith('.html'));
      console.log(`\n📁 Total HTML files in experiences directory: ${htmlFiles.length}`);
    }

  } catch (error) {
    console.error('💥 Fatal error during regeneration:', error);
    process.exit(1);
  }
}

// Run the regeneration
console.log('🚀 AR Experience Regeneration Tool - Enhanced Positioning');
console.log('========================================================\n');

regenerateAllExperiences()
  .then(() => {
    console.log('\n✨ Regeneration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Regeneration failed:', error);
    process.exit(1);
  });
