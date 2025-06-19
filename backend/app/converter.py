import os
import shutil
import logging
from PIL import Image
from reportlab.pdfgen import canvas
from docx import Document
from docx2pdf import convert as docx2pdf_convert
import fitz  # PyMuPDF
from app.aws_utils import upload_to_s3

logger = logging.getLogger(__name__)

def convert_file(input_path, output_format, task_id):
    file_name = os.path.basename(input_path)
    input_ext = os.path.splitext(file_name)[1].lower()
    output_path = f"converted/{task_id}.{output_format}"

    try:
        # 🔹 Convert .txt or .rtf to PDF
        if input_ext in [".txt", ".rtf"] and output_format == "pdf":
            c = canvas.Canvas(output_path)
            with open(input_path, "r", encoding="utf-8") as f:
                text = f.read()
            for i, line in enumerate(text.splitlines()[:60]):
                c.drawString(50, 800 - (15 * i), line)
            c.save()

        # 🔹 Convert .docx or .doc
        elif input_ext in [".docx", ".doc"]:
            if output_format == "pdf":
                temp_doc_path = f"converted/{task_id}.docx"
                shutil.copyfile(input_path, temp_doc_path)
                docx2pdf_convert(temp_doc_path, output_path)
                os.remove(temp_doc_path)

            elif output_format in ["png", "jpg", "jpeg"]:
                doc = Document(input_path)
                text = "\n".join([p.text for p in doc.paragraphs])
                temp_pdf = f"converted/{task_id}.pdf"
                c = canvas.Canvas(temp_pdf)
                for i, line in enumerate(text.splitlines()[:60]):
                    c.drawString(50, 800 - (15 * i), line)
                c.save()

                pdf_doc = fitz.open(temp_pdf)
                pix = pdf_doc[0].get_pixmap()
                pix.save(output_path)
                pdf_doc.close()
                os.remove(temp_pdf)

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

        # 🔹 Upload to S3
        upload_to_s3(output_path, f"{task_id}.{output_format}")
        logger.info(f"Uploaded to S3: {task_id}.{output_format}")

    except Exception as e:
        logger.error(f"Conversion failed: {e}")

    finally:
        # 🔹 Cleanup
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)
