"""
Utility helpers để làm việc với psycopg2 cursors.
Thay thế sqlite3.Row bằng plain dict, giúp code routers không đổi nhiều.
"""
import psycopg2.extras

DEFAULT_HOSPITAL_ID = 1


def fetchone_dict(cursor):
    """Fetch one row as dict. Works with both RealDictCursor and regular cursor."""
    row = cursor.fetchone()
    if row is None:
        return None
    if isinstance(row, dict):
        return dict(row)
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))


def fetchall_dict(cursor):
    """Fetch all rows as list of dicts."""
    rows = cursor.fetchall()
    if not rows:
        return []
    if isinstance(rows[0], dict):
        return [dict(r) for r in rows]
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def get_cursor(conn):
    """Return a RealDictCursor — rows come back as dict automatically."""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)