import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Model Configuration
SIMPLE_TASK_MODEL = "gpt-3.5-turbo"  # For simpler tasks
COMPLEX_TASK_MODEL = "gpt-4"  # For complex reasoning tasks

# API Configuration
OPENAI_API_HOST = "0.0.0.0"
OPENAI_API_PORT = 4000
OPENAI_API_DEBUG = True 