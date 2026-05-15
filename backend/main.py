from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.lifespan import app_lifespan
from routers import farmers, menu, products, upload

app = FastAPI(title="Menu Ingredient Parser API", lifespan=app_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(products.router)
app.include_router(farmers.router)
app.include_router(menu.router)

@app.get("/")
async def root():
    return {"message": "Menu Ingredient Parser API", "status": "running"}
