import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

# Enable the vector extension (needed later for AI search)
cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

# Create the entries table
cur.execute("""
    CREATE TABLE IF NOT EXISTS entries (
        id          SERIAL PRIMARY KEY,
        raw_text    TEXT         NOT NULL,
        summary     TEXT         NOT NULL DEFAULT '',
        title       TEXT         NOT NULL DEFAULT '',
        tags        TEXT[]       NOT NULL DEFAULT '{}',
        embedding   vector(3072) NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
""")

conn.commit()
cur.close()
conn.close()

print("✅ Database table created!")