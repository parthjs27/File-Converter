import boto3
import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET = os.getenv("S3_BUCKET")

print(f"[DEBUG] Loaded S3_BUCKET: {S3_BUCKET}")

s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def upload_to_s3(file_path: str, s3_key: str):
    if not S3_BUCKET:
        print("❌ S3_BUCKET is not defined. Check your .env file and load_dotenv().")
        return

    if not os.path.exists(file_path):
        print(f"❌ File does not exist: {file_path}")
        return

    try:
        s3.upload_file(file_path, S3_BUCKET, s3_key)
        print(f"✅ Uploaded to S3: {s3_key}")
    except Exception as e:
        print(f"❌ S3 Upload Failed: {e}")



def generate_presigned_url(s3_key: str, expiration=3600):
    try:
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': S3_BUCKET, 'Key': s3_key},
            ExpiresIn=expiration
        )
        print(f"Presigned URL generated for {s3_key}")
        return url
    except Exception as e:
        print(f"Failed to generate presigned URL: {e}")
        return None
