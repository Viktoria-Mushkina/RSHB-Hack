import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://rshb_user:rshb_password@postgres:5432/rshb_db",
)
FARMERS_EXCEL_PATH = os.getenv("FARMERS_EXCEL_PATH", "/app/data/farmers.xlsx")
