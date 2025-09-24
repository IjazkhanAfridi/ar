-- Add marker dimensions column to experiences table
-- This script adds support for storing marker image dimensions

-- Add markerDimensions column to experiences table
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS marker_dimensions JSONB;

-- Add comment for documentation
COMMENT ON COLUMN experiences.marker_dimensions IS 'Stores marker image dimensions as {width, height, aspectRatio}';

-- Create index for faster queries on marker dimensions (optional)
CREATE INDEX IF NOT EXISTS idx_experiences_marker_dimensions 
ON experiences USING GIN (marker_dimensions);

-- Update existing experiences to have default marker dimensions if needed
-- This is optional and can be run separately
UPDATE experiences 
SET marker_dimensions = '{"width": 1024, "height": 1024, "aspectRatio": 1.0}'::jsonb
WHERE marker_dimensions IS NULL;

-- Show table structure after migration
\d experiences;
