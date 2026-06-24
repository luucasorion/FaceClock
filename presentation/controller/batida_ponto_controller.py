from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile
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


@router.post("/")
async def bater_ponto(
    geo: str = Form(...),
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

    return usecase.execute(
        login=current_colaborador["sub"],
        imagem=imagem_bytes,
        geo=geo
    )

# PUBLIC — kiosk endpoint; identity established via facial recognition, not a bearer token
@router.post("/embarcado")
async def bater_ponto_embarcado(
    imagem: UploadFile = File(...),
    geo: str = Form(...),
    db: Session = Depends(get_db)
):

    imagem_bytes = await imagem.read()

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