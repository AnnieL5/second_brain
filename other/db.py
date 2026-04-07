import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("API_KEY")

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password=api_key,
    database="your_db"
)

cursor = conn.cursor()