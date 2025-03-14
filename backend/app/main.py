# backend/app/main.py
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import images
from app.database import test_connection, get_database, get_collection
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MultiCrop Backend")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost",
    # Add your real frontend domain(s) here in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the list you defined
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to MultiCrop API", "status": "running"}

@app.get("/test-db")
async def test_db():
    success, message = test_connection()
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {
        "database_connected": success,
        "message": message,
    }

@app.get("/questions")
async def get_all_questions():
    try:
        collection = get_collection("questions")
        logger.info("Fetching all questions")
        questions = list(collection.find({}, {'_id': 0}))
        logger.info(f"Found {len(questions)} questions")
        return {"questions": questions}
    except Exception as e:
        logger.error(f"Error fetching questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions/{question_id}")
async def get_question_by_id(question_id: str):
    try:
        collection = get_collection("questions")
        logger.info(f"Fetching question with ID: {question_id}")
        question = collection.find_one({"question_id": question_id}, {'_id': 0})
        if not question:
            logger.warning(f"Question not found with ID: {question_id}")
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching question {question_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions")
async def create_question(question: Dict[Any, Any] = Body(...)):
    try:
        collection = get_collection("questions")
        logger.info("Creating new question")
        # Check if question_id already exists
        if "question_id" in question and collection.find_one({"question_id": question["question_id"]}):
            raise HTTPException(status_code=400, detail="Question ID already exists")
        result = collection.insert_one(question)
        logger.info(f"Question created with ID: {result.inserted_id}")
        return JSONResponse(
            status_code=201,
            content={"message": "Question created successfully", "question_id": str(result.inserted_id)}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/bulk")
async def create_many_questions(questions: List[Dict[Any, Any]] = Body(...)):
    try:
        collection = get_collection("questions")
        logger.info(f"Creating {len(questions)} questions")
        result = collection.insert_many(questions)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} questions")
        return JSONResponse(
            status_code=201,
            content={
                "message": f"Successfully inserted {len(result.inserted_ids)} questions",
                "inserted_ids": [str(id) for id in result.inserted_ids]
            }
        )
    except Exception as e:
        logger.error(f"Error creating questions in bulk: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include image endpoints with a prefix and tag.
app.include_router(images.router, prefix="/images", tags=["images"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
