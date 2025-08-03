from fastapi import FastAPI, HTTPException
from flask import Flask, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from flask_cors import CORS, cross_origin
import datetime
import json, os, requests
import openai
from typing import List, Dict, Optional

from pydantic import BaseModel
from models.openai_client import OpenAIClient
from agents.validator_agent import ValidatorAgent
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load config file
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
try:
    with open(CONFIG_PATH) as f:
        config = json.load(f)
except Exception as e:
    logger.error(f"Error loading config: {str(e)}")
    config = {}

class ExplanationRequest(BaseModel):
    topic: str
    question: str
    student_id: Optional[str] = None

class ProgressData(BaseModel):
    student_id: str
    board: str
    class_level: str
    subject: str
    topic: str
    understanding_level: int  # 1-5 scale
    questions_asked: int
    time_spent: int  # in minutes

# In-memory storage for progress tracking
progress_db = {}


def update_progress(student_id: str, topic: str):
    if student_id in progress_db:
        # Update the last accessed time for the topic
        for subject in progress_db[student_id]["subjects"].values():
            if topic in subject["topics"]:
                subject["topics"][topic]["last_accessed"] = datetime.now().isoformat()
                subject["topics"][topic]["questions_asked"] += 1
                break 


# Load configuration values
BACKEND_PORT = config.get('backendPort', 5000)
FRONTEND_PORT = config.get('frontendPort', 4001)

# Set up OpenAI API key with proper precedence
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    OPENAI_API_KEY = config.get('OPENAI_API_KEY', '')
    if not OPENAI_API_KEY:
        logger.error("OpenAI API key not found in environment or config")
    elif not OPENAI_API_KEY.startswith('sk-') or 'proj-' in OPENAI_API_KEY:
        logger.error("Invalid OpenAI API key format. Key should start with 'sk-' and not contain 'proj-'")
        OPENAI_API_KEY = ''

openai.api_key = OPENAI_API_KEY


class ChatRequest(BaseModel):
    message: str
    studentId: str = None
    board: str = None
    classLevel: str = None
    subject: str = None
    skipValidation: bool = False


# Initialize OpenAI client and validator agent
client = OpenAIClient()
validator = ValidatorAgent()

logger.info(f"Frontend port: {FRONTEND_PORT}")
#OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

app = Flask(__name__)

# --- JWT Configuration ---
# You can generate a strong secret key using: import os; os.urandom(24).hex()
app.config["JWT_SECRET_KEY"] = "your-super-secret-jwt-key" # Change this in production!
#app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=1) # Access tokens expire in 1 hour
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(minutes=60) # Access tokens expire in 1 Minute

jwt = JWTManager(app)


# Load data paths
# These paths should match your project structure
STUDENTS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'students.json')
SCHOOLS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'schools.json')
BOARDS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'boards.json')

# Function to load student, school, and board data from JSON files
# This function is used to read the data from the JSON files
def load_students():
    with open(STUDENTS_DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# Function to load schools data from JSON file
def load_schools():
    with open(SCHOOLS_DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# Function to load boards data from JSON file
def load_Boards():
    with open(BOARDS_DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


# --- CORS Configuration ---
# Enable CORS for all routes
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:3000", f"http://localhost:{FRONTEND_PORT}"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }})

# --- User Data (for demonstration purposes) ---
users = {
    "testuser": "password123",
    "admin": "adminpass"
}


# --- Routes ---
@app.route("/api/login", methods=["POST", "OPTIONS"])
@cross_origin(origins=[f"http://localhost:{FRONTEND_PORT}", "http://localhost:3000"], 
             allow_headers=["Content-Type", "Authorization"],
             supports_credentials=True)
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    """ 
    Handles user login.
    If credentials are valid, creates and returns a JWT access token.
    """
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    """ 
    Loading user information from backend and 
    """
    students = load_students()
    schools = load_schools()
    boards = load_Boards()
    
    #Variable declaration
    schoolName = ''
    boardName = ''
    userfound = False
    studentFullName = ''
    studentGrade    = ''
    studentDivision = ''


    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    for student in students:
        if student['USERNAME'] == username and student['PASSWORD'] == password:
            # Find the school and board for the student
            for school in schools:
                if school['ID'] == student['SCHOOL_ID']:
                    schoolName= school['NAME']
                    boardid=school['BOARD']
                    break
            
            for board in boards:
                if board['ID'] == boardid:
                    boardName = board['NAME']
                    break
            studentFullName = student['FIRST_NAME'] + " " +  student['LAST_NAME']
            studentGrade = student['GRADE']
            studentDivision = student['DIVISION']
            userfound = True
            break;

    #if users.get(username) == password:

    if userfound:
        print("Student fullname:" + studentFullName)
        print("Student Grade:" + studentGrade)
        print("Student Division:" + studentDivision)
        print("School Name:" +  schoolName) 
        print("Board NAME:" + boardName)
        # Create an access token for the user
        access_token = create_access_token(identity=username)
        print("Access Token Created is:" + access_token)
        return jsonify({"access_token" : access_token,
           "studentFullName": studentFullName,
            "studentGrade": studentGrade,
            "studentDivision":studentDivision,
            "boardName": boardName
        }), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

@app.route("/api/protected", methods=["GET", "OPTIONS"])
@cross_origin(origins=[f"http://localhost:{FRONTEND_PORT}", "http://localhost:3000"], 
             allow_headers=["Content-Type", "Authorization"],
             supports_credentials=True)
@jwt_required() # This decorator protects the endpoint, requiring a valid JWT
def protected():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    """
    A protected endpoint that can only be accessed with a valid JWT.
    It retrieves the identity from the token and returns a message.
    """
    current_user = get_jwt_identity() # Get the identity of the current user from the token
    return jsonify(logged_in_as=current_user, message="You have accessed protected data!"), 200

@app.route("/api/status", methods=["GET"])
@jwt_required(optional=True) # Optional JWT: allows access even without a token
def status():
    """
    An endpoint to check the current user's login status.
    If a valid token is present, it returns the user's identity.
    Otherwise, it indicates no user is logged in.
    """
    current_user = get_jwt_identity()
    if current_user:
        return jsonify(is_logged_in=True, username=current_user), 200
    else:
        return jsonify(is_logged_in=False, username=None), 200

@app.route("/api/subjects", methods=["GET", "OPTIONS"])
@cross_origin(origins=[f"http://localhost:{FRONTEND_PORT}", "http://localhost:3000"], 
             allow_headers=["Content-Type", "Authorization"],
             supports_credentials=True,
             max_age=3600)  # Cache preflight results for 1 hour
@jwt_required() # This decorator protects the endpoint, requiring a valid JWT
def subjects():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers['Access-Control-Max-Age'] = '3600'  # Cache preflight for 1 hour
        return response, 200
        
    """
    A protected endpoint that can only be accessed with a valid JWT.
    It retrieves the identity from the token and returns a message.
    """
    current_user = get_jwt_identity() # Get the identity of the current user from the token
    print('Logged in with ' + current_user)
    board = str(request.args.get('board'))
    class_name = 'Class '+ str(request.args.get('class'))
    print('board:' + board + ' and Class: ' + class_name)
    if not board or not class_name:
        return jsonify({'error': 'Missing board or class parameter'}), 400
    
    subjects_file = os.path.join(os.path.dirname(__file__), 'data', f'{board}-SUBJECTS.json')

    if not os.path.exists(subjects_file):
        return jsonify({'error': f'{board}-SUBJECTS.json not found'}), 404

    try:
        with open(subjects_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Find the class entry
        print(f"Looking for class entry: '{class_name}' in {board}-SUBJECTS.json")
        print(f"Available classes: {[item.get('class') for item in data]}")
        class_entry = next((item for item in data if item.get('class') == class_name), None)
        if not class_entry:
            return jsonify({'error': f'Class {class_name} not found', 'available_classes': [item.get('class') for item in data]}), 404
        subjects = class_entry.get('subjects', {})
        response = jsonify(logged_in_as=current_user, subjects=subjects)
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500
   
#return jsonify(logged_in_as=current_user, message="You have accessed protected data fro Subjecgts Screen!"), 200


@app.route('/api/search', methods=['POST', 'OPTIONS'])
def search():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        query = data.get('message', '')
        if not query:
            return jsonify({'error': 'No message provided'}), 400
            
        logger.info(f"Received search query: {query}")
        
        if not OPENAI_API_KEY:
            logger.error("OpenAI API key not configured")
            return jsonify({'error': 'OpenAI API key not configured'}), 500
            
        # Call OpenAI ChatGPT API
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful educational assistant."},
                {"role": "user", "content": query}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        answer = response.choices[0].message.content
        logger.info("Successfully generated response")
        return jsonify({'results': [answer]})
        
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI Authentication error: {str(e)}")
        return jsonify({'error': 'Invalid OpenAI API key'}), 401
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return jsonify({'error': 'OpenAI API error'}), 503
    except Exception as e:
        logger.error(f"Unexpected error in search: {str(e)}")
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    print("Inside /api/chat endpoint call")
    data = request.get_json()
    print("Data Sent from Client is ::" + str(data))
    query = data.get('message', '')
    """Endpoint to handle chat messages"""
    try:
        logger.info(f"Received message: {query}")
        
        # Generate response using OpenAI
        response = client.generate(query)
        logger.info(f"Generated response: {response}")
        
        # Skip validation if requested or if the message is a numerical operation
        #if request.skipValidation or any(op in request.message for op in ['+', '-', '*', '/']):
        if data.get('skipValidation') or any(op in query for op in ['+', '-', '*', '/']):
            return {
                "response": response,
                "validation": {"is_valid": True}
            }
        
        # Validate the response
        validation_result = validator.validate(response)
        logger.info(f"Validation result: {validation_result}")
        
        # If validation fails, return an error message
        if not validation_result['is_valid']:
            error_messages = [
                result['message'] 
                for result in validation_result['validation_results'].values() 
                if not result['valid']
            ]
            return {
                "response": "I apologize, but I need to rephrase my response to meet our quality standards.",
                "validation_errors": error_messages
            }
        
        return {
            "response": response,
            "validation": validation_result
        }
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.route("/api/explain", methods=["POST", "OPTIONS"])
def explain_concept():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    data = request.get_json()
    try:
        # Generate AI response
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful educational assistant. Explain concepts clearly and concisely, using age-appropriate language and examples."},
                {"role": "user", "content": f"Topic: {data.get('topic')}\nQuestion: {data.get('question')}"}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        explanation = response.choices[0].message.content

        # Update progress if student_id is provided
        if request.student_id:
            update_progress(request.student_id, request.topic)

        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.route("/api/progress", methods=["POST", "OPTIONS"])
def update_student_progress():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    data = request.get_json()
    try:
        student_id = data.get("student_id")
        if student_id not in progress_db:
            progress_db[student_id] = {
                "board": data.get("board"),
                "class_level": data.get("class_level"),
                "subjects": {}
            }

        subject = data.get("subject")
        if subject not in progress_db[student_id]["subjects"]:
            progress_db[student_id]["subjects"][subject] = {
                "topics": {},
                "total_time_spent": 0,
                "total_questions_asked": 0
            }

        subject_data = progress_db[student_id]["subjects"][subject]
        topic = data.get("topic")
        time_spent = data.get("time_spent", 0)
        questions_asked = data.get("questions_asked", 0)
        
        subject_data["topics"][topic] = {
            "understanding_level": data.get("understanding_level"),
            "questions_asked": questions_asked,
            "time_spent": time_spent,
            "last_updated": datetime.now().isoformat()
        }

        subject_data["total_time_spent"] += time_spent
        subject_data["total_questions_asked"] += questions_asked

        return {"status": "success", "message": "Progress updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.route("/api/progress/{student_id}", methods=["GET"])
async def get_student_progress(student_id: str):
    try:
        if student_id not in progress_db:
            raise HTTPException(status_code=404, detail="Student not found")
        return progress_db[student_id]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Health Check Endpoint ---
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    # Run the Flask app on port 5000
    app.run(debug=True, port=BACKEND_PORT)
