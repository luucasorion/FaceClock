from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.orm import Session
from infra.db.database import get_db
from infra.repositories.colaborador_repository import ColaboradorRepository
from infra.repositories.batida_ponto_repository import BatidaPontoRepository

from application.services.facial_service import FacialService
from application.use_cases.ponto.batida_ponto_usecase import BaterPontoUseCase
from application.use_cases.ponto.batida_ponto_embarcado_usecase import BatidaPontoEmbarcadoUseCase
from presentation.dependencies.auth import get_current_colaborador


router = APIRouter(
    prefix="/ponto",
    tags=["Ponto"]
)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def validar_upload_imagem(imagem: UploadFile, conteudo: bytes) -> None:

    if not imagem.content_type or not imagem.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Tipo de arquivo inválido; envie uma imagem"
        )

    if len(conteudo) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Imagem vazia"
        )

    if len(conteudo) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Imagem muito grande"
        )


@router.post("/")
async def bater_ponto(
    geo: str | None = Form(None),
    imagem: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_colaborador: dict = Depends(get_current_colaborador)
):

    colaborador_repository = ColaboradorRepository(db)

    batida_ponto_repository = BatidaPontoRepository(db)

    facial_service = FacialService()

    usecase = BaterPontoUseCase(
        colaborador_repository,
        batida_ponto_repository,
        facial_service
    )

    imagem_bytes = await imagem.read()

    validar_upload_imagem(imagem, imagem_bytes)

    return usecase.execute(
        login=current_colaborador["sub"],
        imagem=imagem_bytes,
        geo=geo
    )

@router.post("/embarcado")
async def bater_ponto_embarcado(
    imagem: UploadFile = File(...),
    geo: str | None = Form(None),
    db: Session = Depends(get_db)
):

    imagem_bytes = await imagem.read()

    validar_upload_imagem(imagem, imagem_bytes)

    colaborador_repository = ColaboradorRepository(db)
    batida_repository = BatidaPontoRepository(db)
    facial_service = FacialService()

    usecase = BatidaPontoEmbarcadoUseCase(
        colaborador_repository=colaborador_repository,
        batida_repository=batida_repository,
        facial_service=facial_service
    )

    resultado = usecase.execute(
        imagem=imagem_bytes,
        geo=geo
    )

    return resultado