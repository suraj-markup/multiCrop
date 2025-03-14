# First remove existing structure if any
rm -rf app tests

# Create new directory structure
mkdir -p app/api/endpoints
mkdir -p app/models
mkdir -p app/schemas
mkdir -p app/services
mkdir -p app/utils
mkdir -p tests

# Create necessary __init__.py files
touch app/__init__.py
touch app/api/__init__.py
touch app/api/endpoints/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/utils/__init__.py

# Create required files
touch app/main.py
touch app/config.py
touch app/api/endpoints/images.py
touch app/models/image.py
touch app/schemas/image.py
touch app/services/image_service.py
touch app/utils/firebase_client.py
touch tests/test_images.py
touch requirements.txt 