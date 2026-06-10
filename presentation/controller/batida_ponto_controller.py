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