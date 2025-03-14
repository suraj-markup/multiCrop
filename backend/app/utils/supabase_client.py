# backend/app/utils/supabase_client.py
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET

# Use the config values instead of hardcoding
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_file_supabase(file_obj, destination_path: str) -> str:
    """
    Uploads a file's bytes to Supabase Storage and returns the public URL.
    """
    print("SUPABASE_BUCKET in main server:", SUPABASE_BUCKET)
    try:
        # Debug: Print bucket info
        print(f"Using bucket: {SUPABASE_BUCKET}")
        
        # Ensure we're reading from the beginning of the file
        file_obj.seek(0)
        # Read the file content as bytes
        file_bytes = file_obj.read()
        # Upload the file bytes
        response = supabase.storage.from_(SUPABASE_BUCKET).upload(destination_path, file_bytes, file_options={"content-type": "image/png"})
        
        # The response structure changed in newer versions of the Supabase Python client
        # Handle both old and new response formats
        if isinstance(response, dict) and response.get("error"):
            raise Exception("Failed to upload file: " + response["error"]["message"])
        
        # Get the public URL for the uploaded file
        try:
            # For newer Supabase client versions
            public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(destination_path)
            if isinstance(public_url, str):
                return public_url
            elif isinstance(public_url, dict) and "publicURL" in public_url:
                return public_url["publicURL"]
            else:
                # Fallback to constructing the URL manually
                return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{destination_path}"
        except Exception as e:
            print(f"Error getting public URL: {e}")
            # Fallback to constructing the URL manually
            return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{destination_path}"
    except Exception as e:
        print(f"Error in upload_file_supabase: {e}")
        raise