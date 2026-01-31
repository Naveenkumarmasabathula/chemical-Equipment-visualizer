import sqlite3

conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print("=== TABLES ===")
print(", ".join(tables))
for t in tables:
    cur.execute("SELECT * FROM " + t)
    rows = cur.fetchall()
    if not rows:
        print("\n--- " + t + " (0 rows) ---")
        continue
    cols = [d[0] for d in cur.description]
    print("\n--- " + t + " (" + str(len(rows)) + " row(s)) ---")
    print(" | ".join(cols))
    for row in rows:
        vals = []
        for v in row:
            if v is None:
                vals.append("")
            else:
                s = str(v)
                vals.append(s[:50] + "..." if len(s) > 50 else s)
        print(" | ".join(vals))
conn.close()
