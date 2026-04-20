from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai import summarise, embed, answer as ai_answer
import db
from db import save_entry, search

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request models ---
class StoreRequest(BaseModel):
    raw_text: str
    tags: list[str] = []

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

# --- New models ---

# class FolderCreate(BaseModel):
#     name: str

# class MoveEntry(BaseModel):
#     folder_id: int | None  # None means "remove from folder"
    
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
    mode = data.get("mode", "find")   # "find" or "ask"
    limit = data.get("limit", 5)
    tags = data.get("tags", None)

    # Always embed and search first
    query_vector = embed(query)
    results = search(query_vector, limit=limit, tags=tags)

    if mode == "ask":
        # Synthesise an answer from the top results
        synthesised = ai_answer(query, results)
        return {
            "answer": synthesised,
            "sources": [{"id": r["id"], "title": r["title"], "summary": r["summary"], "score": r["score"]} for r in results]
        }
    else:
        # Just return the ranked list
        return {"results": results}
    
# @app.post("/folders")
# def create_folder(body: FolderCreate):
#     try:
#         return db.create_folder(body.name)
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

@app.get("/entries")
def get_entries(page: int = 1, limit: int = 20):
    return db.list_entries(page=page, limit=limit)

# @app.get("/entries")
# def get_entries(page: int = 1, limit: int = 20, tag: str = None,
#                 sort: str = "newest", folder_id: int = None):
#     return db.list_entries(page, limit, tag, sort, folder_id)

# @app.get("/folders")
# def get_folders():
#     return db.list_folders()

@app.delete("/entries/{entry_id}")
def delete(entry_id: int):
    success = db.delete_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}

# @app.delete("/folders/{folder_id}")
# def remove_folder(folder_id: int):
#     db.delete_folder(folder_id)
#     return {"ok": True}

# @app.patch("/entries/{entry_id}/folder")
# def move_to_folder(entry_id: int, body: MoveEntry):
#     db.move_entry_to_folder(entry_id, body.folder_id)
#     return {"ok": True}

