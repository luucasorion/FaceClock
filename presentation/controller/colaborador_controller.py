from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from infra.db.database import SessionLocal

from infra.repositories.colaborador_repository import ColaboradorRepository

from application.useCases.colaborador.registrar_colaborador_usecase import (
    RegistrarColaboradorUseCase
)

from application.services.hash_service import HashService

from presentation.schema.requests.registro_colaborador_request import (
    RegistroColaboradorRequest
)


router = APIRouter(
    prefix="/colaborador/registro",
    tags=["Colaborador"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/")
def registro_colaborador(
    body: RegistroColaboradorRequest,
    db: Session = Depends(get_db)
):

    repository = ColaboradorRepository(db)

    hash_service = HashService()

    usecase = RegistrarColaboradorUseCase(
        repository,
        hash_service
    )

    colaborador = usecase.execute(
        cpf=body.cpf,
        nome=body.nome,
        login=body.login,
        senha=body.senha,
        empresa_id=body.empresa_id,
        facial=body.facial
    )

    return colaborador