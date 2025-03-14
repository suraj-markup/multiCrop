# test_upload.py
import io
from app.utils.supabase_client import upload_file_supabase
# from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET
from supabase import create_client, Client

def test_upload():
    # Create a file-like object in memory
    file_obj = io.BytesIO(b"Supabase connectivity test.")
    file_obj.seek(0)  # Reset the pointer to the start of the file
    
    try:
        destination_path = "sd.png"
        public_url = upload_file_supabase(file_obj=file_obj, destination_path=destination_path)
        print("Test file uploaded successfully. Public URL:", public_url)
    except Exception as e:
        print("Error uploading file:", e)

if __name__ == "__main__":
    test_upload()
