# File-Converter
A sleek, dark-themed file converter application that converts various types of files into defined format types.

## Features

- **Modern Dark UI**: Sleek, eye-friendly dark theme with gradient accents
- **Smart Format Detection**: Automatically detects file extensions and suggests compatible output formats
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Interactive Elements**: Smooth hover effects and transitions
- **Multiple Format Support**: Handles documents, images, videos, and audio files

## Project Setup

### Frontend (Next.js + Tailwind CSS)

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Supported File Formats

### Input Formats
- **Documents**: DOCX, PDF, TXT, RTF
- **Images**: JPG, PNG, WEBP
- **Videos**: MP4, AVI, MOV
- **Audio**: MP3, WAV, AAC, OGG

### Output Formats
- **Documents**: PDF, DOCX, TXT, RTF
- **Images**: PNG, JPG, WEBP, PDF
- **Videos**: AVI, MOV, GIF
- **Audio**: WAV, AAC, OGG

## Usage

1. **Upload**: Click "Choose File" to select a file from your device
2. **Detect**: The app automatically detects the file format and displays it
3. **Select**: Choose your desired output format from the dropdown
4. **Convert**: Click "Download Converted File" to process and download

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useRef)
- **Icons**: Heroicons (SVG)

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Project Structure

```
File-Converter/
├── frontend/                 # Next.js application
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx      # Main file converter component
│   │       ├── layout.tsx    # Root layout with metadata
│   │       └── globals.css   # Global styles and dark theme
│   ├── package.json
│   └── README.md
└── README.md                 # This file
```
