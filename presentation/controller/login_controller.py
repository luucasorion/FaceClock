from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from infra.db.database import SessionLocal

from infra.repositories.colaborador_repository import (
    ColaboradorRepository
)

from application.useCases.colaborador.login_colaborador_usecase import (
    LoginColaboradorUseCase
)

from application.services.hash_service import (
    HashService
)

from presentation.schema.requests.login_colaborador_request import (
    LoginColaboradorRequest
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/login")
def login_colaborador(
    body: LoginColaboradorRequest,
    db: Session = Depends(get_db)
):

    repository = ColaboradorRepository(db)

    hash_service = HashService()

    usecase = LoginColaboradorUseCase(
        repository,
        hash_service
    )

    colaborador = usecase.execute(
        login=body.login,
        senha=body.senha
    )

    return colaborador