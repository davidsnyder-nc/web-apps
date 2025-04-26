# Video Collage Creator

A web application for creating dynamic video collages with customizable layouts and audio control.

## Features

- Create video collages with multiple videos in a 16:9 format
- Choose from 5 different layouts:
  - Grid
  - Picture-in-Picture
  - Side by Side
  - Stacked Rows
  - Featured
- Control audio settings for each video
- Pop-out collage into a clean new window
- Easy-to-use dropdown menus for layout and audio settings
- Manual video playback controls

## Technology

- React.js
- FFmpeg for video processing
- HTML5 video controls
- CSS3 for responsive layouts

## How to Use

1. Click "Add Videos" to upload video files
2. Select a layout from the dropdown menu
3. Control audio settings with the audio dropdown
4. Use the "Pop Out Collage" button to view in a separate window
5. Use the video controls to play, pause, and adjust volume

## Development

### Build and Run Locally

```bash
# Clone the repository
git clone https://github.com/davidsnyder-nc/video-collage-creator.git
cd video-collage-creator

# Install dependencies
npm install

# Start development server
npm start
```

### Building for Production

```bash
# Create production build
npm run build

# Serve production build
npx serve -s build
```

## License

MIT