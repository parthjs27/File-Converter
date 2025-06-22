import os
import uuid
import json
import logging
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from rq import Queue
from app.converter import convert_file
from app.aws_utils import generate_presigned_url

# 🔹 Logger Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# 🔹 CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Redis + RQ
redis_conn = Redis()
task_queue = Queue(connection=redis_conn)

# 🔹 Allowed Formats
ALLOWED_INPUT_FORMATS = [".docx", ".doc", ".txt", ".rtf", ".pdf", ".jpeg", ".jpg", ".png"]
ALLOWED_OUTPUT_FORMATS = [".pdf", ".docx", ".png", ".jpeg"]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), output_format: str = Form(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    logger.info(f"Received file upload: {file.filename}, target format: {output_format}")

    if ext not in ALLOWED_INPUT_FORMATS:
        logger.warning(f"Unsupported input format: {ext}")
        return {"error": "Unsupported input format"}

    if f".{output_format}" not in ALLOWED_OUTPUT_FORMATS:
        logger.warning(f"Unsupported output format: {output_format}")
        return {"error": "Unsupported output format"}

    task_id = str(uuid.uuid4())
    input_path = f"temp/{task_id}_{file.filename}"

    try:
        # Save file to disk
        with open(input_path, "wb") as f:
            f.write(await file.read())
        logger.info(f"Saved file to {input_path}")

        # Enqueue task with function object instead of string reference
        job = task_queue.enqueue(convert_file, input_path, output_format, task_id)
        logger.info(f"Enqueued conversion task: {task_id}")

        # Save initial task metadata to Redis
        task_data = {
            "status": "processing",
            "output_format": output_format
        }
        redis_conn.set(task_id, json.dumps(task_data))
        logger.info(f"Stored initial task metadata in Redis for {task_id}")

        return {"message": "Processing started", "task_id": task_id}

    except Exception as e:
        logger.error(f"Upload processing failed: {str(e)}")
        return {"error": "Internal server error"}

@app.get("/status/{task_id}")
def check_status(task_id: str):
    try:
        task_data = redis_conn.get(task_id)
        if not task_data:
            logger.warning(f"Task ID not found: {task_id}")
            return {"error": "Task not found"}

        task_info = json.loads(task_data)
        status = task_info.get("status", "unknown")
        
        if status == "completed":
            s3_key = task_info.get("s3_key")
            if s3_key:
                url = generate_presigned_url(s3_key)
                if url:
                    logger.info(f"Generated presigned URL for {s3_key}")
                    return {"status": "completed", "download_url": url}
                else:
                    return {"error": "Failed to generate download URL"}
            else:
                return {"error": "No S3 key found for completed task"}
        
        elif status == "error":
            error_msg = task_info.get("error", "Unknown error")
            logger.error(f"Task {task_id} failed: {error_msg}")
            return {"error": error_msg}
        
        elif status == "processing":
            return {"status": "processing", "message": "File is being converted"}
        
        else:
            return {"error": "Unknown task status"}

    except Exception as e:
        logger.error(f"Error in /status/{task_id}: {str(e)}")
        return {"error": "Failed to retrieve task info"}
