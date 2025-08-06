import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Compile marker image for AR.js pattern recognition
 */
export async function compileMarker(imageBuffer) {
  try {
    // Process the image to be suitable for marker detection
    const processedBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    throw new Error(`Failed to compile marker: ${error.message}`);
  }
}

/**
 * Generate AR.js pattern file from marker image
 */
export async function generatePatternFile(imageBuffer) {
  // This is a simplified version - in a real implementation,
  // you would use AR.js pattern generation algorithms
  const processedMarker = await compileMarker(imageBuffer);
  
  // For now, return the processed image buffer
  // In a real implementation, this would generate a .patt file
  return processedMarker;
}

/**
 * Save marker pattern file
 */
export async function saveMarkerPattern(experienceId, imageBuffer) {
  const patternsDir = path.join(process.cwd(), 'uploads', 'patterns');
  
  // Ensure directory exists
  try {
    await fs.access(patternsDir);
  } catch {
    await fs.mkdir(patternsDir, { recursive: true });
  }

  const patternBuffer = await generatePatternFile(imageBuffer);
  const filename = `pattern_${experienceId}.patt`;
  const filepath = path.join(patternsDir, filename);
  
  await fs.writeFile(filepath, patternBuffer);
  
  return {
    filename,
    filepath,
    url: `/uploads/patterns/${filename}`,
  };
}
