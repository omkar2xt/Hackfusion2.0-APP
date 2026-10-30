import sqlite3

conn = sqlite3.connect('signalsafe.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(incidents);")
cols = [r[1] for r in cursor.fetchall()]
print("Current columns in incidents:", cols)

if "department" not in cols:
    cursor.execute("ALTER TABLE incidents ADD COLUMN department TEXT DEFAULT 'General Campus'")
    conn.commit()
    print("Added department column!")

conn.close()
print("Migration completed successfully.")
