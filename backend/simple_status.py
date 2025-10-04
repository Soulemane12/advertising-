# Add this route to your main.py file

@app.get("/api/videos/{video_id}/status")
async def get_video_status(video_id: str):
    """
    Poll TwelveLabs for task status and return simplified status
    """
    if video_id not in DB:
        return {"error": "Video not found"}, 404

    video_data = DB[video_id]
    task_id = video_data["task_id"]

    try:
        # Check TwelveLabs task status
        headers = {"x-api-key": TL_KEY}
        r = requests.get(f"{TL_API}/tasks/{task_id}", headers=headers)
        r.raise_for_status()

        task_data = r.json()
        tl_status = task_data.get("status", "processing")

        # Map TwelveLabs status to our simplified status
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

            # Fetch analysis if not already cached
            if not video_data.get("analysis"):
                try:
                    video_id_tl = task_data.get("video_id")
                    video_r = requests.get(f"{TL_API}/videos/{video_id_tl}", headers=headers)
                    if video_r.ok:
                        video_data["analysis"] = video_r.json()
                        DB[video_id] = video_data
                except:
                    pass

        elif tl_status == "failed":
            status = "error"
            progress = 0
            message = "Analysis failed"
        else:
            status = "processing"
            progress = 35
            message = f"Processing (TL status: {tl_status})"

        # Update our DB
        video_data.update({
            "status": status,
            "progress": progress,
            "message": message
        })
        DB[video_id] = video_data

        return {
            "id": video_id,
            "status": status,
            "progress": progress,
            "message": message,
            "analysis": video_data.get("analysis")
        }

    except requests.exceptions.RequestException:
        # Return cached status if TwelveLabs is unreachable
        return {
            "id": video_id,
            "status": video_data.get("status", "processing"),
            "progress": video_data.get("progress", 0),
            "message": "Status check failed - using cached status"
        }