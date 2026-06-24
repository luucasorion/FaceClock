from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from infra.db.database import get_db
from infra.repositories.colaborador_repository import ColaboradorRepository
from infra.security.token_service import TokenService

from application.use_cases.colaborador.login_colaborador_usecase import (
    LoginColaboradorUseCase
)

from application.services.hash_service import HashService

from presentation.schema.requests.login_colaborador_request import (
    LoginColaboradorRequest
)

from presentation.schema.responses.colaborador_response import ColaboradorResponse
from presentation.schema.responses.auth_response import AuthTokenResponse


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


# PUBLIC — token issuance entry point
@router.post("/login", response_model=AuthTokenResponse)
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

    result = usecase.execute(
        login=body.login,
        senha=body.senha
    )

    token_service = TokenService()
    token = token_service.gerar_token({
        "sub": result["login"],
        "cpf": result["cpf"],
        "empresa_id": result["empresa_id"],
        "gerente": result["gerente"],
    })

    return AuthTokenResponse(
        access_token=token,
        colaborador=ColaboradorResponse(**result),
    )