import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
const backendPublicPath = path.join(__dirname, '..', 'public');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ Frontend build not found at: ${src}`);
    console.error('Please run: cd frontend && npm run build');
    process.exit(1);
  }

  // Remove existing public directory
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
    console.log('🗑️  Removed existing public directory');
  }

  // Create public directory
  fs.mkdirSync(dest, { recursive: true });

  // Copy all files from dist to public
  const items = fs.readdirSync(src);
  let copiedFiles = 0;

  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      copiedFiles++;
    }
  });

  return copiedFiles;
}

try {
  console.log('📦 Copying frontend build to backend/public...');
  const copiedFiles = copyDir(frontendDistPath, backendPublicPath);
  console.log(`✅ Successfully copied ${copiedFiles} files to backend/public`);
  console.log('🚀 Backend is now ready to serve the frontend!');
} catch (error) {
  console.error('❌ Error copying frontend:', error.message);
  process.exit(1);
}