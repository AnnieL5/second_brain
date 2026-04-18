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

def list_entries(page: int = 1, limit: int = 20, tag: str = None, 
                 sort: str = "newest", folder_id: int = None) -> list:
    conn = get_connection()
    cur = conn.cursor()
    
    conditions = []
    params = []
    
    if tag:
        conditions.append("%s = ANY(tags)")
        params.append(tag)
    
    if folder_id is not None:
        conditions.append("folder_id = %s")
        params.append(folder_id)
    
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    order = "DESC" if sort == "newest" else "ASC"
    offset = (page - 1) * limit
    
    cur.execute(f"""
        SELECT id, title, summary, tags, created_at, folder_id
        FROM entries
        {where}
        ORDER BY created_at {order}
        LIMIT %s OFFSET %s
    """, params + [limit, offset])
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0], "title": r[1], "summary": r[2],
            "tags": r[3], "created_at": r[4], "folder_id": r[5]
        }
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
        
        
def create_folder(name: str) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO folders (name) VALUES (%s) RETURNING id, name, created_at", (name,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "name": row[1], "created_at": row[2]}


def list_folders() -> list:
    conn = get_connection()
    cur = conn.cursor()
    # Also counts how many entries are in each folder
    cur.execute("""
        SELECT f.id, f.name, f.created_at, COUNT(e.id) as entry_count
        FROM folders f
        LEFT JOIN entries e ON e.folder_id = f.id
        GROUP BY f.id, f.name, f.created_at
        ORDER BY f.created_at ASC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {"id": r[0], "name": r[1], "created_at": r[2], "entry_count": r[3]}
        for r in rows
    ]


def delete_folder(folder_id: int):
    conn = get_connection()
    cur = conn.cursor()
    # Notes in this folder become unfoldered (folder_id becomes NULL)
    cur.execute("DELETE FROM folders WHERE id = %s", (folder_id,))
    conn.commit()
    cur.close()
    conn.close()


def move_entry_to_folder(entry_id: int, folder_id: int | None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE entries SET folder_id = %s WHERE id = %s",
        (folder_id, entry_id)
    )
    conn.commit()
    cur.close()
    conn.close()