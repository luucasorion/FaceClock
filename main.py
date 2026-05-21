from fastapi import FastAPI
from presentation.controller.ColaboradorController import router as colaboradorRouter

from infra.db.base import Base
from infra.db.database import engine


from domain.models.empresa import Empresa
from domain.models.colaborador import Colaborador
from domain.models.batidaPonto import BatidaPonto


app = FastAPI()
app.include_router(colaboradorRouter)


@app.on_event("startup")
def startup():

    Base.metadata.create_all(bind=engine)