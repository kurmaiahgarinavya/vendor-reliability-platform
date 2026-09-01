from fastapi import FastAPI
from database import Base, engine
import models

from routers.auth import router as auth_router

app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)

# Include authentication routes
app.include_router(auth_router)


@app.get("/")
def home():
    return {
        "message": "Vendor Reliability Platform API is running"
    }