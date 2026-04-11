import os
import psycopg2
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

def list_entries(page: int = 1, limit: int = 20) -> list[dict]:
    conn = get_conn()
    cur = conn.cursor()
    offset = (page - 1) * limit
    cur.execute(
        "SELECT id, raw_text, title, summary, tags, created_at FROM entries ORDER BY created_at DESC LIMIT %s OFFSET %s",
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