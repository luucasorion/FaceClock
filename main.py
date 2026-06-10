from fastapi import FastAPI
from presentation.controller.colaborador_controller import router as colaboradorRouter
from presentation.controller.login_controller import router as loginRouter
from presentation.controller.batida_ponto_controller import router as pontoRouter

from infra.db.base import Base
from infra.db.database import engine


from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador
from domains.models.batida_ponto import BatidaPonto


app = FastAPI()
app.include_router(colaboradorRouter )
app.include_router(loginRouter )
app.include_router(pontoRouter)


@app.on_event("startup")
def startup():

    Base.metadata.create_all(bind=engine)