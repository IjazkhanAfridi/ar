# 3D Transform Controls Integration Guide

## Overview

This AR Configurator application now includes comprehensive 3D transform controls powered by Three.js TransformControls. Users can interactively manipulate 3D objects both in the scene editor and in the AR viewer using mouse interactions and keyboard shortcuts.

## Features

### 🎯 Click-to-Select
- Click on any 3D object to select it
- Selected objects display visual transform handles
- Selection information appears in the UI

### ⌨️ Keyboard Shortcuts
The application supports industry-standard keyboard shortcuts for 3D manipulation:

| Key | Action |
|-----|--------|
| **W** | Switch to translate (move) mode |
| **E** | Switch to rotate mode |
| **R** | Switch to scale mode |
| **Q** | Toggle between world/local coordinate space |
| **X** | Toggle X-axis visibility |
| **Y** | Toggle Y-axis visibility |
| **Z** | Toggle Z-axis visibility |
| **Space** | Toggle transform controls enabled/disabled |
| **Esc** | Deselect current object |
| **+/=** | Increase transform control size |
| **-** | Decrease transform control size |

### 🖱️ Mouse Interactions
- **Click**: Select objects
- **Drag handles**: Transform objects along specific axes
- **Orbit**: Use mouse to orbit around the scene (when not dragging)

## Implementation Details

### AR Viewer Enhancements
The AR viewer (`frontend/src/components/ar-viewer.jsx`) now includes:

1. **TransformControls Integration**
   - Initialized with the AR camera and renderer
   - Automatically attached to selected objects
   - Updates object transforms in real-time

2. **Object Selection System**
   - Raycasting-based click detection
   - Proper object hierarchy handling
   - Visual feedback for selected objects

3. **Keyboard Shortcut System**
   - Global keyboard event handling
   - Contextual shortcuts (only active when objects are selected)
   - Proper event cleanup

4. **Enhanced UI**
   - Transform controls help panel (toggleable)
   - Current selection information display
   - Visual indicators for current transform mode

### Scene Editor Enhancements
The scene editor components have been enhanced with:

1. **Consistent Keyboard Shortcuts**
   - Same keyboard shortcuts as AR viewer
   - Integrated into the useThreeScene hook

2. **Help Documentation**
   - Collapsible keyboard shortcuts panel
   - Integrated into the right sidebar

3. **Improved User Experience**
   - Better visual feedback
   - Consistent interaction patterns

### Supported Content Types
Transform controls work with all supported content types:

- **3D Models** (GLTF/GLB files)
- **Images** (PNG, JPG, etc.)
- **Videos** (MP4, WebM, etc.)
- **Audio** (visual representation)
- **Lights** (SpotLight with helpers)

## Usage Instructions

### In Scene Editor
1. Upload or add content to your scene
2. Click on any object to select it
3. Use mouse to drag transform handles OR use keyboard shortcuts
4. Use the right sidebar panels for precise control
5. View keyboard shortcuts by expanding the help panel

### In AR Viewer
1. Start the AR experience
2. Point camera at the marker image
3. Click on any 3D object to select it
4. Use keyboard shortcuts to switch transform modes:
   - Press **W** for move mode
   - Press **E** for rotate mode  
   - Press **R** for scale mode
5. Drag the colored handles to transform objects
6. Press **Esc** to deselect

### Tips for Best Experience
- Use **Q** to switch between world and local coordinate spaces
- Use **+/-** to adjust control handle size for better visibility
- Use **Space** to temporarily disable controls for better viewing
- Use individual axis toggles (**X/Y/Z**) to constrain transformations

## Technical Architecture

### Key Components
- `ARViewer`: Enhanced with TransformControls and keyboard handling
- `useThreeScene`: Scene management hook with keyboard shortcuts
- `SidebarRight`: UI components with help documentation
- `TransformPanels`: Precision control panels

### Event Handling
- Global keyboard event listeners with proper cleanup
- Mouse event handling for object selection
- Transform event listeners for real-time updates

### State Management
- Selected object state management
- Transform mode state synchronization
- UI visibility state for help panels

## Browser Compatibility
- Works in all modern browsers that support WebGL
- Requires camera permissions for AR functionality
- Keyboard shortcuts work across all platforms

## Performance Considerations
- Efficient raycasting for object selection
- Proper cleanup of event listeners
- Optimized render loops
- Memory management for 3D objects

This implementation provides a professional-grade 3D manipulation experience that rivals industry-standard 3D software while maintaining the simplicity needed for AR applications.