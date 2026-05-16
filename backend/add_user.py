import sqlite3
import bcrypt

conn = sqlite3.connect('quantis.db')
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
if cur.fetchone():
    password_hash = bcrypt.hashpw(b'demo123', bcrypt.gensalt()).decode()
    cur.execute("DELETE FROM users WHERE email = 'demo@quantis.ai'")
    cur.execute("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
                ('3', 'demo@quantis.ai', 'Demo User', password_hash))
    conn.commit()
    print('Demo user created: demo@quantis.ai / demo123')
else:
    print('Users table does not exist')

conn.close()