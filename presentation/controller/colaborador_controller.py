from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile
)
from sqlalchemy.orm import Session

from application.services.facial_service import FacialService
from application.useCases.ponto.cadastrar_biometria_usecase import CadastrarBiometriaUseCase
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

@router.post("/cadastrar-biometria")
async def cadastrar_biometria(
    login: str = Form(...),
    imagem: UploadFile = File(...),
    db=Depends(get_db)
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
        login=login,
        imagem=imagem_bytes
    )