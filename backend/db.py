import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def save_entry(raw_text: str, title:str, summary:str, tags: list[str], embedding:list[float]) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO entries (raw_text, title, summary, tags, embedding) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
        (raw_text, title, summary, tags, embedding)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "created_at": row[1]}

def list_entries(page: int = 1, limit: int = 20, sort: str = "newest") -> list[dict]:
    conn = get_conn()
    cur = conn.cursor()
    offset = (page - 1) * limit
    order = "ASC" if sort == "oldest" else "DESC"
    cur.execute(
        f"SELECT id, raw_text, title, summary, tags, created_at FROM entries ORDER BY created_at {order} LIMIT %s OFFSET %s",
        (limit, offset)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {"id": r[0], "raw_text": r[1], "title": r[2], "summary": r[3], "tags": r[4], "created_at": r[5]}
        for r in rows
    ]
    
def delete_entry(entry_id: int) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM entries WHERE id = %s", (entry_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted

def search(query_embedding: list, limit: int = 5, tags: list = None) -> list:
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if tags:
                cur.execute("""
                    SELECT id, title, summary, tags,
                           1 - (embedding <=> %s::vector) AS score
                    FROM entries
                    WHERE tags && %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                """, (query_embedding, tags, query_embedding, limit))
            else:
                cur.execute("""
                    SELECT id, title, summary, tags,
                           1 - (embedding <=> %s::vector) AS score
                    FROM entries
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                """, (query_embedding, query_embedding, limit))
            return cur.fetchall()
   
def update_entry_tags(entry_id: int, tags: list[str]) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE entries SET tags = %s WHERE id = %s RETURNING id, title, summary, tags, created_at",
        (tags, entry_id)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "title": row[1], "summary": row[2], "tags": row[3], "created_at": row[4]}