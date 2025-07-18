import os
import sys
from dotenv import load_dotenv
from redis import Redis
from rq import Worker, Queue, Connection

# Add the parent directory to Python path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from the backend .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Debug to confirm env loaded
S3_BUCKET = os.getenv("S3_BUCKET")
print(f"[worker] Loaded S3_BUCKET: {S3_BUCKET}")

# Redis connection using environment variables
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_conn = Redis(host=redis_host, port=redis_port)

# Import the function that will be used by RQ
from app.converter import convert_file

# Set up Queue
listen_queues = ['default']

if __name__ == '__main__':
    with Connection(redis_conn):
        worker = Worker(map(Queue, listen_queues))
        worker.work(with_scheduler=True)
