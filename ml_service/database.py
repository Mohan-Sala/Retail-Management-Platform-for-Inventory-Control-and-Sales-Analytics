from pymongo import MongoClient
from ml_service.config import settings

class DatabaseConnection:
    def __init__(self):
        self.client = None
        self.db = None

    def connect(self):
        try:
            self.client = MongoClient(settings.MONGO_URI)
            try:
                self.db = self.client.get_default_database()
            except Exception:
                self.db = self.client.get_database(settings.MONGO_DB_NAME)
            print(f"[MongoDB] Connected successfully to database: {self.db.name}")
        except Exception as e:
            print(f"[MongoDB] Failed to connect: {e}")
            raise e

    def get_db(self):
        if self.db is None:
            self.connect()
        return self.db

db_conn = DatabaseConnection()

def get_mongo_db():
    return db_conn.get_db()
