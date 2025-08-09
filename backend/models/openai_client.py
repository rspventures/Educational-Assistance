from openai import OpenAI
from config import SIMPLE_TASK_MODEL, OPENAI_API_KEY
import logging

logger = logging.getLogger(__name__)

class OpenAIClient:
    def __init__(self):
        # Initialize the OpenAI client with the API key
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized")

    def generate(self, prompt, model=None):
        if model is None:
            model = SIMPLE_TASK_MODEL
        try:
            logger.info(f"Generating response with model: {model}")
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error in OpenAI API call: {str(e)}")
            raise Exception(f"OpenAI API error: {str(e)}")
