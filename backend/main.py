from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai import summarise, embed
import db
from db import save_entry, search

app = FastAPI()

# --- Request models ---
class StoreRequest(BaseModel):
    raw_text: str
    tags: list[str] = []

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

# --- Routes ---

@app.post("/store")
async def store(data: dict):
    raw_text = data["raw_text"]
    user_tags = data.get("tags", [])

    # 1. Ask AI to summarise
    result = summarise(raw_text)

    # 2. Merge user tags with AI-suggested tags (no duplicates)
    all_tags = list(set(user_tags + result["tags"]))

    # 3. Turn the summary into a vector
    vector = embed(result["summary"])

    # 4. Save everything to the database
    entry = save_entry(
        raw_text=raw_text,
        summary=result["summary"],
        title=result["title"],
        tags=all_tags,
        embedding=vector,
    )
    return entry

@app.post("/search")
async def search_entries(data: dict):
    query = data["query"]
    limit = data.get("limit", 5)
    tags = data.get("tags", None)

    # Turn the search query into a vector
    query_vector = embed(query)

    # Find closest matches in the database
    results = search(query_vector, limit=limit, tags=tags)
    return {"results": results}

@app.get("/entries")
def get_entries(page: int = 1, limit: int = 20):
    return db.list_entries(page=page, limit=limit)

@app.delete("/entries/{entry_id}")
def delete(entry_id: int):
    success = db.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}

