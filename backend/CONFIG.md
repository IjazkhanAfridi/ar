# AR Configurator Backend Configuration

## New AR Positioning System

The AR positioning system has been completely redesigned to fix the discrepancy between creation and launch experiences.

### Environment Variables

Add these to your `.env` file for precise AR positioning control:

```env
# AR Positioning Configuration - IMPROVED SYSTEM
AR_POSITION_SCALE=1.0              # 1:1 scale for accurate positioning (was 0.5)
AR_ENFORCE_TOP_DOWN=true           # Enforce top-down view for images  
AR_Y_OFFSET=0.01                   # Minimal Y offset to avoid z-fighting (was 0.3)
AR_PRESERVE_TRANSFORMS=true        # Preserve user-defined transforms
```

### Key Improvements

1. **Accurate Position Scaling**: Uses 1:1 scaling instead of 0.5x reduction
2. **Transform Preservation**: Keeps user-defined rotations and scales
3. **Smart Top-Down View**: Only applies top-down rotation when needed
4. **Marker Dimension Awareness**: Considers actual marker image size
5. **Precision Calculations**: Uses precise floating-point arithmetic

### Migration Steps

1. **Database Update**: Run the migration to add marker dimensions:
   ```bash
   psql -d your_database -f migrate-marker-dimensions.sql
   ```

2. **Regenerate Experiences**: Update all existing experiences:
   ```bash
   node regenerate-all-experiences-improved.js
   ```

3. **Environment Setup**: Add the new AR positioning variables to your `.env` file

### Database Schema Changes

- Added `marker_dimensions` JSONB column to `experiences` table
- Stores: `{width: number, height: number, aspectRatio: number}`
- Indexed for performance with GIN index

### Positioning Algorithm

The new `transformPlacement()` function:

1. **Preserves Original Values**: Keeps user-set position/rotation/scale
2. **Applies Minimal Scaling**: Uses 1:1 position scale for accuracy
3. **Smart Rotation**: Only enforces top-down for images when not user-set
4. **Precise Output**: Returns values with 3 decimal precision
5. **A-Frame Compatibility**: Converts radians to degrees for A-Frame

### Before vs After

**Before** (Old System):
- Forced all rotations to (90, 0, 0)
- Scaled positions by 0.5
- Ignored user scaling
- No marker dimension consideration

**After** (New System):
- Preserves user rotations when set
- 1:1 position scaling
- Respects user scaling values
- Considers marker image dimensions
- Smart top-down view only when needed

### Testing

After applying changes:

1. Create a new experience with specific positioning
2. Launch the experience and verify positioning matches creation
3. Check that top-down view is maintained
4. Verify scaling and rotation work as expected

### Cleanup Completed

Removed unused files:
- All `test-*.js` files
- All `debug-*.js` files  
- `check-latest-experience.js`
- Unused React components:
  - `scene-editor-new.jsx`
  - `scene-editor-r3f.jsx`
  - `FiberSceneEditor.jsx`
  - `R3FSceneContainer-fixed.jsx`
