from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import db

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
def store(req: StoreRequest):
    result = db.save_entry(req.raw_text, req.tags)
    return {
        "id": result["id"],
        "title": "",
        "summary": req.raw_text,  # no AI yet, just echo back
        "tags": req.tags,
        "created_at": result["created_at"]
    }

@app.post("/search")
def search(req: SearchRequest):
    # Phase 1: just return all entries (no vector search yet)
    entries = db.list_entries(limit=req.limit)
    return {"results": entries}

@app.get("/entries")
def get_entries(page: int = 1, limit: int = 20):
    return db.list_entries(page=page, limit=limit)

@app.delete("/entries/{entry_id}")
def delete(entry_id: int):
    success = db.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}