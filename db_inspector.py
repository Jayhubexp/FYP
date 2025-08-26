import sqlite3
import os

def final_inspection():
    """
    Connects to KJV.db and prints the complete schema (all table names
    and the columns within each table). This will reveal the true structure.
    """
    db_path = os.path.join('src', 'data', 'KJV.db')
    
    if not os.path.exists(db_path):
        print(f"--- ERROR ---\nDatabase file not found at: {db_path}")
        return

    print(f"--- Performing Final Inspection of: {db_path} ---\n")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get all table names from the database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        if not tables:
            print("--- RESULT ---\nNo tables found in the database file.")
            return

        print("--- TABLES FOUND ---")
        for table in tables:
            table_name = table[0]
            print(f"\n[+] Table: '{table_name}'")
            
            # Get the schema (column names and types) for the table
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            if columns:
                print("  Columns:")
                for col in columns:
                    # col is a tuple: (id, name, type, notnull, default_value, pk)
                    print(f"    - {col[1]} ({col[2]})")
            else:
                print("  No columns found for this table.")

        print("\n" + "-"*40)
        print("Inspection complete. Please copy the entire output above.")

    except Exception as e:
        print(f"\n--- An unexpected error occurred ---\n{e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    final_inspection()