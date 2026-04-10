import os, json
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

SUMMARISE_SYSTEM = """You are a personal knowledge assistant. Return ONLY a JSON object with keys:
  "title"   — short descriptive title, max 8 words
  "summary" — clean summary, 2–4 sentences
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