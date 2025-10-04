# Video Analysis Advertising System

A modern video analysis platform that uses TwelveLabs AI to analyze video content for advertising insights.

## Features

- **Video Upload**: Drag-and-drop interface for video files or URL input
- **Real-time Analysis**: Live progress tracking of video processing
- **TwelveLabs Integration**: AI-powered video content analysis
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+
- **AI**: TwelveLabs Video Understanding API
- **Deployment**: Vercel (Frontend), Railway/Render (Backend recommended)

## Setup

### Environment Variables

Create a `.env.local` file in the root directory:

```env
TL_API_KEY=your_twelvelabs_api_key
TL_INDEX_ID=your_twelvelabs_index_id
ELEVEN_API_KEY=your_elevenlabs_api_key_optional
```

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Python Backend**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. **Create TwelveLabs Index**
   ```bash
   cd backend
   python create_index.py
   ```

4. **Run Development Servers**
   ```bash
   # Run both frontend and backend concurrently
   npm run dev

   # Or run separately:
   npm run dev:frontend  # Frontend only
   npm run dev:backend   # Backend only
   ```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Railway/Render)

1. Deploy the `backend/` directory
2. Install Python dependencies from `requirements.txt`
3. Set environment variables
4. Run command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

### Update Frontend for Production

Update the API URLs in the frontend components to point to your deployed backend.

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── Upload.tsx       # Video upload interface
│   │   └── StatusPoller.tsx # Real-time status polling
│   ├── app/
│   │   ├── page.tsx         # Main page
│   │   └── api/             # Next.js API routes (unused in production)
├── backend/
│   ├── main.py              # FastAPI application
│   ├── create_index.py      # TwelveLabs index setup
│   └── requirements.txt     # Python dependencies
├── start-backend.sh         # Backend startup script
└── package.json             # Node.js configuration
```

## API Endpoints

- `POST /api/videos` - Upload video file or URL
- `GET /api/videos/{id}/status` - Get video processing status
- `GET /health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
