from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile
)
from sqlalchemy.orm import Session

from application.services.facial_service import FacialService
from application.use_cases.ponto.cadastrar_biometria_usecase import CadastrarBiometriaUseCase
from infra.db.database import get_db

from infra.repositories.colaborador_repository import ColaboradorRepository

from application.use_cases.colaborador.registrar_colaborador_usecase import (
    RegistrarColaboradorUseCase
)
from application.use_cases.colaborador.get_colaborador_usecase import (
    GetColaboradorUseCase
)
from application.use_cases.colaborador.edicao_colaborador_usecase import (
    EdicaoColaboradorUseCase
)

from application.services.hash_service import HashService

from presentation.schema.requests.registro_colaborador_request import (
    RegistroColaboradorRequest
)
from presentation.schema.requests.edicao_colaborador_request import (
    EdicaoColaboradorRequest
)
from presentation.schema.requests.edicao_perfil_request import (
    EdicaoPerfilRequest
)

from presentation.schema.responses.colaborador_response import ColaboradorResponse
from presentation.schema.responses.auth_response import AuthTokenResponse
from presentation.dependencies.auth import get_current_colaborador, require_manager

from infra.security.token_service import TokenService


router = APIRouter(
    prefix="/colaborador/registro",
    tags=["Colaborador"]
)

read_router = APIRouter(
    prefix="/colaborador",
    tags=["Colaborador"]
)


# PUBLIC — collaborator provisioning before any session exists
@router.post("/", response_model=AuthTokenResponse)
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

    # AUTHZ-2: gerente elevation locked to False until manager guard is implemented
    colaborador = usecase.execute(
        cpf=body.cpf,
        nome=body.nome,
        login=body.login,
        senha=body.senha,
        empresa_id=body.empresa_id,
        facial=body.facial,
        gerente=False
    )

    response = ColaboradorResponse.model_validate(colaborador)

    token_service = TokenService()
    token = token_service.gerar_token({
        "sub": colaborador.login,
        "cpf": colaborador.cpf,
        "empresa_id": colaborador.empresa_id,
        "gerente": colaborador.gerente,
    })

    return AuthTokenResponse(
        access_token=token,
        colaborador=response,
    )

# self-enrollment only — identity comes from the token, never from client input
@router.post("/cadastrar-biometria")
async def cadastrar_biometria(
    imagem: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_colaborador: dict = Depends(get_current_colaborador)
):

    colaborador_repository = (
        ColaboradorRepository(db)
    )

    facial_service = FacialService()

    usecase = CadastrarBiometriaUseCase(
        colaborador_repository,
        facial_service
    )

    imagem_bytes = await imagem.read()

    return usecase.execute(
        login=current_colaborador["sub"],
        imagem=imagem_bytes
    )


# identity comes ONLY from token claims — never from client input
@read_router.get("/me", response_model=ColaboradorResponse)
def get_me(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    repository = ColaboradorRepository(db)
    usecase = GetColaboradorUseCase(repository)
    return usecase.por_login(payload["sub"])


# company scope comes ONLY from token claims — manager-only listing
@read_router.get("/", response_model=list[ColaboradorResponse])
def listar_colaboradores(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    repository = ColaboradorRepository(db)
    usecase = GetColaboradorUseCase(repository)
    return usecase.listar_por_empresa(payload["empresa_id"])


# self-edit — identity comes ONLY from token claims; gerente is pinned and unchangeable.
# Declared BEFORE PUT /{cpf} so "me" is not captured as a cpf path param.
@read_router.put("/me", response_model=ColaboradorResponse)
def editar_perfil(
    body: EdicaoPerfilRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    repository = ColaboradorRepository(db)
    hash_service = HashService()
    usecase = EdicaoColaboradorUseCase(repository, hash_service)
    return usecase.executar(
        requester_empresa_id=payload["empresa_id"],
        requester_login=payload["sub"],
        target_cpf=payload["cpf"],
        nome=body.nome,
        login=body.login,
        gerente=None,
        senha=body.senha,
    )


@read_router.put("/{cpf}", response_model=ColaboradorResponse)
def editar_colaborador(
    cpf: str,
    body: EdicaoColaboradorRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    repository = ColaboradorRepository(db)
    hash_service = HashService()
    usecase = EdicaoColaboradorUseCase(repository, hash_service)
    return usecase.executar(
        requester_empresa_id=payload["empresa_id"],
        requester_login=payload["sub"],
        target_cpf=cpf,
        nome=body.nome,
        login=body.login,
        gerente=body.gerente,
        senha=body.senha,
    )


@read_router.delete("/{cpf}", response_model=ColaboradorResponse)
def desativar_colaborador(
    cpf: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    repository = ColaboradorRepository(db)
    hash_service = HashService()
    usecase = EdicaoColaboradorUseCase(repository, hash_service)
    return usecase.desativar(
        requester_empresa_id=payload["empresa_id"],
        requester_login=payload["sub"],
        target_cpf=cpf,
    )