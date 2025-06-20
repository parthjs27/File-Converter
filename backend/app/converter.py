import os
import shutil
import json
import logging
from PIL import Image
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from docx import Document
import fitz  # PyMuPDF
from app.aws_utils import upload_to_s3
from redis import Redis

logger = logging.getLogger(__name__)

def convert_file(input_path, output_format, task_id):
    file_name = os.path.basename(input_path)
    input_ext = os.path.splitext(file_name)[1].lower()
    output_path = f"converted/{task_id}.{output_format}"
    
    redis_conn = Redis()

    try:
        logger.info(f"Starting conversion: {input_path} -> {output_format}")
        
        styles = getSampleStyleSheet()

        # 🔹 Convert .txt or .rtf to PDF
        if input_ext in [".txt", ".rtf"] and output_format == "pdf":
            with open(input_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            text = text.replace('\\n', '<br/>')
            story = [Paragraph(text, styles["BodyText"])]
            pdf = SimpleDocTemplate(output_path)
            pdf.build(story)

        # 🔹 Convert .docx or .doc
        elif input_ext in [".docx", ".doc"]:
            doc = Document(input_path)
            
            if output_format == "pdf":
                story = [Paragraph(p.text.replace('\\n', '<br/>'), styles["BodyText"]) for p in doc.paragraphs]
                pdf = SimpleDocTemplate(output_path)
                pdf.build(story)

            elif output_format in ["png", "jpg", "jpeg"]:
                temp_pdf_path = f"converted/{task_id}_temp.pdf"
                story = [Paragraph(p.text.replace('\\n', '<br/>'), styles["BodyText"]) for p in doc.paragraphs]
                pdf = SimpleDocTemplate(temp_pdf_path)
                pdf.build(story)

                pdf_doc = fitz.open(temp_pdf_path)
                pix = pdf_doc[0].get_pixmap()
                pix.save(output_path)
                pdf_doc.close()
                os.remove(temp_pdf_path)

        # 🔹 Convert PDF to Image
        elif input_ext == ".pdf" and output_format in ["jpg", "jpeg", "png"]:
            pdf_doc = fitz.open(input_path)
            pix = pdf_doc[0].get_pixmap()
            pix.save(output_path)
            pdf_doc.close()

        # 🔹 Convert Image to PDF or other image formats
        elif input_ext in [".jpg", ".jpeg", ".png"]:
            image = Image.open(input_path)
            if output_format == "pdf":
                image.convert("RGB").save(output_path)
            else:
                image.save(output_path)

        # 🔹 Fallback (copy as-is)
        else:
            shutil.copyfile(input_path, output_path)

        # Check if output file was created
        if not os.path.exists(output_path):
            raise Exception(f"Conversion failed: output file {output_path} was not created")

        logger.info(f"Conversion completed: {output_path}")

        # 🔹 Upload to S3
        s3_key = f"{task_id}.{output_format}"
        upload_success = upload_to_s3(output_path, s3_key)
        
        if not upload_success:
            raise Exception("Failed to upload file to S3")
            
        logger.info(f"Uploaded to S3: {s3_key}")

        # Update Redis with success status
        task_data = {
            "status": "completed",
            "output_format": output_format,
            "s3_key": s3_key
        }
        redis_conn.set(task_id, json.dumps(task_data))
        logger.info(f"Updated Redis status for task {task_id}")

    except Exception as e:
        logger.error(f"Conversion failed for task {task_id}: {e}")
        
        # Update Redis with error status
        task_data = {
            "status": "error",
            "error": str(e),
            "output_format": output_format
        }
        redis_conn.set(task_id, json.dumps(task_data))
        logger.info(f"Updated Redis error status for task {task_id}")

    finally:
        # 🔹 Cleanup
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
                logger.info(f"Cleaned up input file: {input_path}")
            
            if os.path.exists(output_path):
                os.remove(output_path)
                logger.info(f"Cleaned up output file: {output_path}")
        except Exception as cleanup_error:
            logger.error(f"Cleanup error: {cleanup_error}")
