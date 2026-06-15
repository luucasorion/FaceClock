from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile
)

from infra.db.database import get_db
from infra.repositories.colaborador_repository import ColaboradorRepository
from infra.repositories.batida_ponto_repository import BatidaPontoRepository

from application.services.facial_service import FacialService
from application.useCases.ponto.batida_ponto_usecase import BaterPontoUseCase
from application.useCases.ponto.batida_ponto_embarcado_usecase import BatidaPontoEmbarcadoUseCase


router = APIRouter(
    prefix="/ponto",
    tags=["Ponto"]
)


@router.post("/")
async def bater_ponto(
    login: str = Form(...),
    geo: str = Form(...),
    imagem: UploadFile = File(...),
    db=Depends(get_db)
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

    return usecase.execute(
        login=login,
        imagem=imagem_bytes,
        geo=geo
    )

@router.post("/embarcado")
async def bater_ponto_embarcado(
    imagem: UploadFile = File(...),
    geo: str = Form(...),
    db=Depends(get_db)
):

    imagem_bytes = await imagem.read()

    colaborador_repository = (
        ColaboradorRepository(db)
    )

    batida_repository = (
        BatidaPontoRepository(db)
    )

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