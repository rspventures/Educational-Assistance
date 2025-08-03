from ..models.openai_client import OpenAIClient
from ..config import COMPLEX_TASK_MODEL

class ExplainerAgent:
    def __init__(self):
        self.client = OpenAIClient()

    def explain(self, query, context=None):
        # Construct the prompt with context if available
        if context:
            prompt = f"""Context: {context}
Question: {query}
Please provide a clear, age-appropriate explanation suitable for elementary school students."""
        else:
            prompt = f"""Question: {query}
Please provide a clear, age-appropriate explanation suitable for elementary school students."""

        # Use GPT-4 for complex explanations
        response = self.client.generate(prompt, model=COMPLEX_TASK_MODEL)
        return response 