import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from presentation.controller.colaborador_controller import router as colaboradorRouter
from presentation.controller.colaborador_controller import read_router as colaboradorReadRouter
from presentation.controller.login_controller import router as loginRouter
from presentation.controller.batida_ponto_controller import router as pontoRouter
from presentation.controller.empresa_controller import router as empresaRouter
from presentation.controller.relatorio_controller import router as relatorioRouter

from infra.db.base import Base
from infra.db.database import engine

from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador
from domains.models.batida_ponto import BatidaPonto

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
app.include_router(colaboradorReadRouter)
app.include_router(loginRouter)
app.include_router(pontoRouter)
app.include_router(empresaRouter)
app.include_router(relatorioRouter)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    # lightweight migration — create_all does not alter existing tables
    with engine.connect() as conn:
        columns = conn.execute(text("PRAGMA table_info(colaboradores)")).fetchall()
        column_names = [row[1] for row in columns]
        if "gerente" not in column_names:
            conn.execute(
                text("ALTER TABLE colaboradores ADD COLUMN gerente BOOLEAN NOT NULL DEFAULT 0")
            )
            conn.commit()

        # create_all only builds indexes for NEW tables — add them idempotently
        # for pre-existing databases.
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_batida_colaborador_batida "
                "ON batidas_ponto (colaborador_id, batida)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_colaborador_empresa_id "
                "ON colaboradores (empresa_id)"
            )
        )
        conn.commit()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )