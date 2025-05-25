import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://gcphmqkssyeippswxxfz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcGhtcWtzc3llaXBwc3d4eGZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIyNTAxMiwiZXhwIjoyMDU1ODAxMDEyfQ.gW_T3i392eRKq8JDmdI1gktZDG3M_-UM5275NTzEndo")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "Images")

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://surajmarkup:Qazwsxedc123@cluster0.lwsst.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "pdftoppt")
