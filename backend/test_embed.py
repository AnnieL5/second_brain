import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
response = client.models.embed_content(
    model="gemini-embedding-001",
    contents="Hello world",
    config={
            'task_type': 'RETRIEVAL_DOCUMENT',
            'title': 'Embedding for search'
        }
)
print(f"Success! Vector length: {len(response.embeddings[0].values)}")