import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from presentation.controller.colaborador_controller import router as colaboradorRouter
from presentation.controller.login_controller import router as loginRouter

from infra.db.base import Base
from infra.db.database import engine

from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador
from domains.models.batidaPonto import BatidaPonto

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(colaboradorRouter)
app.include_router(loginRouter)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )