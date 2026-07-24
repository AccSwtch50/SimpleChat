import sqlite3
import json
import uuid
from datetime import datetime

class DatabaseWriter:
    def __init__(self,db_path):
        self.db_path = db_path

    def runmany(self, statements: list):
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        try:
            for sql, parameters in statements:
                connection.execute(sql, parameters)
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def run(self, sql: str, parameters: tuple = ()):
        connection = sqlite3.connect(self.db_path)
        try:
            cursor = connection.execute(sql, parameters)
            connection.commit()
            return cursor.lastrowid
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def query(self, sql: str, parameters: tuple = ()):
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        try:
            cursor = connection.execute(sql, parameters)
            return cursor.fetchone()
        finally:
            connection.close()

    def queryall(self, sql: str, parameters: tuple = ()):
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        try:
            cursor = connection.execute(sql, parameters)
            return cursor.fetchall()
        finally:
            connection.close()
