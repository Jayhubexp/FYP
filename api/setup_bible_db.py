#!/usr/bin/env python3
"""
Final, Corrected Bible DB Setup Script (Emoji-Free)
This script is specifically tailored to the user's KJV.db file by using the
correct table names: 'KJV_verses' and 'KJV_books'.
"""
import os
import sqlite3

def create_unified_db(dest_db):
    """Creates the final bible.db with the correct schema."""
    os.makedirs(os.path.dirname(dest_db), exist_ok=True)
    conn = sqlite3.connect(dest_db)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bible (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()
    print(f"Destination database '{dest_db}' is ready.")

def copy_kjv_verses(kjv_db_path, dest_db):
    """
    Reads the specific KJV.db, performs the correct SQL JOIN using the
    correct table names, and inserts the data into our unified bible.db.
    """
    print(f"\nProcessing '{kjv_db_path}'...")
    if not os.path.exists(kjv_db_path):
        print("KJV.db not found. Skipping.")
        return

    try:
        src_conn = sqlite3.connect(kjv_db_path)
        src_cursor = src_conn.cursor()

        # This SQL query uses the exact table and column names from your file.
        sql_query = """
        SELECT
            b.name,
            v.chapter,
            v.verse,
            v.text
        FROM
            KJV_verses v
        JOIN
            KJV_books b ON v.book_id = b.id
        ORDER BY
            v.id;
        """

        print(" -> Executing final SQL JOIN...")
        src_cursor.execute(sql_query)
        rows = src_cursor.fetchall()
        src_conn.close()
        print(f" -> Successfully fetched {len(rows)} verses.")

        dest_conn = sqlite3.connect(dest_db)
        dest_cursor = dest_conn.cursor()
        
        version = 'KJV'
        rows_with_version = [(version, row[0], row[1], row[2], row[3]) for row in rows]

        dest_cursor.execute("DELETE FROM bible WHERE version=?", (version,))
        dest_cursor.executemany(
            "INSERT INTO bible (version, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)",
            rows_with_version
        )
        dest_conn.commit()
        dest_conn.close()
        
        print(f"SUCCESS: Wrote {dest_cursor.rowcount} KJV verses to the final bible.db.")

    except Exception as e:
        print(f"FAILED: An unexpected error occurred: {e}")

if __name__ == '__main__':
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kjv_db_path = os.path.join(project_root, 'src', 'data', 'KJV.db')
    dest_db_path = os.path.join(project_root, 'src', 'data', 'bible.db')

    create_unified_db(dest_db_path)
    copy_kjv_verses(kjv_db_path, dest_db_path)

    print("\nDatabase setup complete.")