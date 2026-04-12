import os, json
from groq import Groq
from google import genai
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
# openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def embed(text: str) -> list[float]:
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config={
                'task_type': 'RETRIEVAL_DOCUMENT',
                'title': 'Embedding for search'
            }
    )
    return response.embeddings[0].values

SUMMARISE_SYSTEM = """You are a personal knowledge assistant. Return ONLY a JSON object with keys:
  "title"   — short descriptive title, max 8 words
  "summary" — clean summary, very easy to understand, as short as possible, max 4 sentences
  "tags"    — array of 3–6 lowercase tags, no spaces
No preamble. No markdown. Pure JSON only."""

def summarise(raw_text: str) -> dict:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SUMMARISE_SYSTEM},
            {"role": "user", "content": raw_text},
        ],
    )
    return json.loads(response.choices[0].message.content)

def answer(question: str, entries: list[dict]) -> str:
    # Format entries so the AI can read them
    formatted = "\n".join(
        f'[{i+1}] Title: "{e["title"]}"  Summary: "{e["summary"]}"'
        for i, e in enumerate(entries)
    )

    system = f"""You are a personal knowledge assistant. Synthesise a clear answer
using ONLY these entries. Do not add outside knowledge. If the entries
don't contain enough info, say so plainly.

Entries:
{formatted}"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": question},
        ],
    )
    return response.choices[0].message.content