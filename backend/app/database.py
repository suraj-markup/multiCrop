from pymongo import MongoClient
from app.config import MONGODB_URI, MONGODB_DB_NAME
from pymongo.server_api import ServerApi
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_connection():
    try:
        # Create MongoDB client with server API
        client = MongoClient(MONGODB_URI, server_api=ServerApi('1'))
        # Send a ping to confirm a successful connection
        client.admin.command('ping')
        logger.info("MongoDB connection successful!")
        return True, "Successfully connected to MongoDB!"
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        return False, f"Failed to connect to MongoDB: {str(e)}"

# Create MongoDB client
try:
    client = MongoClient(MONGODB_URI, server_api=ServerApi('1'))
    # Get database
    db = client[MONGODB_DB_NAME]
    logger.info(f"Connected to database: {MONGODB_DB_NAME}")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise e

# Function to get database instance
def get_database():
    return db

# Function to get a specific collection
def get_collection(collection_name: str):
    try:
        collection = db[collection_name]
        logger.info(f"Accessing collection: {collection_name}")
        return collection
    except Exception as e:
        logger.error(f"Error accessing collection {collection_name}: {str(e)}")
        raise e

# print(get_collection("questions"))

# Test connection on module import
# message = get_collection("questions")
# print(message)    