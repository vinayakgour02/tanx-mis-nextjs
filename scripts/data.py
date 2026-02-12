import mysql.connector
import json
from urllib.parse import urlparse
from datetime import date, datetime
from decimal import Decimal

# --- CONFIG: DATABASE_URL ---
DATABASE_URL = "mysql://mis_user:VinayakGour02.@82.112.226.63:3306/mis_backend"

# --- PARSE URL ---
parsed_url = urlparse(DATABASE_URL)
DB_CONFIG = {
    "host": parsed_url.hostname,
    "port": parsed_url.port or 3306,
    "user": parsed_url.username,
    "password": parsed_url.password,
    "database": parsed_url.path.lstrip("/")
}

# --- CONNECT TO DB ---
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor(dictionary=True)

# --- GET ALL TABLES ---
cursor.execute("SHOW TABLES")
tables = [list(t.values())[0] for t in cursor.fetchall()]

# --- GET FOREIGN KEYS ---
foreign_keys = {}
for table in tables:
    cursor.execute(f"""
        SELECT 
            COLUMN_NAME, 
            REFERENCED_TABLE_NAME, 
            REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}' 
          AND TABLE_NAME = '{table}' 
          AND REFERENCED_TABLE_NAME IS NOT NULL
    """)
    fk_list = cursor.fetchall()
    if fk_list:
        foreign_keys[table] = fk_list

# --- LOAD ALL TABLE DATA ---
table_data = {}
for table in tables:
    cursor.execute(f"SELECT * FROM {table}")
    table_data[table] = cursor.fetchall()

# --- NESTING FUNCTION ---
def nest_table(parent_table, parent_rows, visited_tables=set()):
    visited_tables.add(parent_table)
    
    for table, fks in foreign_keys.items():
        if table in visited_tables:
            continue
        for fk in fks:
            if fk['REFERENCED_TABLE_NAME'] == parent_table:
                for parent_row in parent_rows:
                    parent_id = parent_row[fk['REFERENCED_COLUMN_NAME']]
                    child_rows = [
                        row for row in table_data[table] 
                        if row[fk['COLUMN_NAME']] == parent_id
                    ]
                    parent_row[table] = child_rows
                    nest_table(table, child_rows, visited_tables.copy())

# --- FIND ROOT TABLES ---
referenced_tables = {fk['REFERENCED_TABLE_NAME'] for fks in foreign_keys.values() for fk in fks}
root_tables = [t for t in tables if t not in referenced_tables]

# --- CONVERT DATETIME & DECIMAL TO STRING/NUMBER ---
def convert_types(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)  # or str(obj) if you prefer
    raise TypeError(f"Type {type(obj)} not serializable")

# --- BUILD NESTED JSON ---
nested_db = {}
for root in root_tables:
    root_rows = table_data[root]
    nest_table(root, root_rows)
    nested_db[root] = root_rows

# --- SAVE TO JSON FILE ---
with open("nested_database.json", "w", encoding="utf-8") as f:
    json.dump(nested_db, f, indent=4, ensure_ascii=False, default=convert_types)

print("✅ Nested JSON exported to nested_database.json")

cursor.close()
conn.close()
