import os
import time
import uuid
import requests
import re
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from parent directory's .env.local
load_dotenv("../.env.local")

# TwelveLabs API configuration
TL_API = "https://api.twelvelabs.io/v1.3"
TL_KEY = os.environ.get("TL_API_KEY", "")
INDEX_ID = os.environ.get("TL_INDEX_ID", "")

if not TL_KEY:
    raise RuntimeError("TL_API_KEY environment variable is required")

app = FastAPI(title="Video Analysis API", version="1.0.0")

# CORS middleware for development
# Allows any localhost port (3000, 3001, 3002, etc.) for flexible development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database for hackathon (use real DB in production)
DB = {}

class VideoStatus(BaseModel):
    id: str
    status: str
    progress: int
    message: str
    error: Optional[str] = None
    task_id: Optional[str] = None
    analysis: Optional[dict] = None

@app.get("/")
async def root():
    return {"message": "Video Analysis API", "status": "running"}

@app.post("/api/videos")
async def create_video(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None)
):
    """
    Upload a video file or URL to TwelveLabs for analysis
    Returns a videoId for tracking the analysis progress
    """
    try:
        # Validate inputs
        if not file and not url:
            raise HTTPException(status_code=400, detail="Provide either file or url")

        # Ensure index exists
        if not INDEX_ID:
            raise HTTPException(
                status_code=500,
                detail="Create your TwelveLabs index once and set TL_INDEX_ID in .env"
            )

        headers = {"x-api-key": TL_KEY}
        task_id = None

        if url:
            # Handle URL upload - TwelveLabs requires multipart/form-data for all requests
            response = requests.post(
                f"{TL_API}/tasks",
                headers=headers,
                files={
                    "index_id": (None, INDEX_ID),
                    "video_url": (None, url)
                },
                timeout=30
            )
            response.raise_for_status()
            response_data = response.json()
            # TwelveLabs returns _id instead of task_id
            task_id = response_data.get("_id") or response_data.get("task_id")

        elif file:
            # Handle file upload
            file_content = await file.read()
            files = {
                "file": (file.filename, file_content, file.content_type)
            }
            data = {
                "index_id": INDEX_ID
            }

            response = requests.post(
                f"{TL_API}/tasks",
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            response.raise_for_status()
            response_data = response.json()
            # TwelveLabs returns _id instead of task_id
            task_id = response_data.get("_id") or response_data.get("task_id")

        # Generate our internal video ID
        video_id = f"vid_{uuid.uuid4().hex[:8]}"

        # Store in our database
        DB[video_id] = {
            "status": "processing",
            "progress": 10,
            "message": "Video submitted to TwelveLabs for analysis",
            "task_id": task_id,
            "analysis": None,
            "created_at": time.time()
        }

        return {"videoId": video_id}

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"TwelveLabs API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/videos/{video_id}/status")
async def get_video_status(video_id: str):
    """
    Get the current status of a video analysis task
    """
    if video_id not in DB:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data = DB[video_id]
    task_id = video_data["task_id"]

    try:
        # Check status with TwelveLabs
        headers = {"x-api-key": TL_KEY}
        response = requests.get(
            f"{TL_API}/tasks/{task_id}",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()

        task_data = response.json()
        tl_status = task_data.get("status", "processing")

        # Map TwelveLabs status to our status
        if tl_status == "pending":
            status = "processing"
            progress = 25
            message = "Video queued for processing"
        elif tl_status == "indexing":
            status = "indexing"
            progress = 50
            message = "Analyzing video content"
        elif tl_status == "ready":
            status = "completed"
            progress = 100
            message = "Analysis complete"

            # Fetch the analysis results if completed
            if not video_data.get("analysis"):
                try:
                    # Get video details from TwelveLabs
                    video_response = requests.get(
                        f"{TL_API}/videos/{task_data.get('video_id')}",
                        headers=headers,
                        timeout=10
                    )
                    if video_response.ok:
                        video_details = video_response.json()
                        DB[video_id]["analysis"] = video_details
                except:
                    pass  # Continue without analysis details

        elif tl_status == "failed":
            status = "error"
            progress = 0
            message = "Analysis failed"
            DB[video_id]["error"] = task_data.get("error_message", "Unknown error")
        else:
            status = "processing"
            progress = 35
            message = f"Processing (TL status: {tl_status})"

        # Update our database
        DB[video_id].update({
            "status": status,
            "progress": progress,
            "message": message
        })

        return VideoStatus(
            id=video_id,
            status=status,
            progress=progress,
            message=message,
            error=video_data.get("error"),
            task_id=task_id,
            analysis=video_data.get("analysis")
        )

    except requests.exceptions.RequestException as e:
        # Return cached status if TwelveLabs is unreachable
        return VideoStatus(
            id=video_id,
            status=video_data["status"],
            progress=video_data["progress"],
            message=f"Status check failed: {str(e)}",
            task_id=task_id
        )

@app.get("/api/videos/{video_id}")
async def get_video_details(video_id: str):
    """
    Get detailed analysis results for a completed video
    """
    if video_id not in DB:
        raise HTTPException(status_code=404, detail="Video not found")

    video_data = DB[video_id]

    if video_data["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="Video analysis not yet complete"
        )

    return {
        "videoId": video_id,
        "status": video_data["status"],
        "analysis": video_data.get("analysis"),
        "task_id": video_data["task_id"]
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "twelvelabs_configured": bool(TL_KEY and INDEX_ID)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)