from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel


class BatidaItemResponse(BaseModel):
    id: str
    colaborador_id: str
    geo: Optional[str]
    batida: datetime
    tipo: Literal["entrada", "saida"]

    class Config:
        from_attributes = True


class DiaHistoricoResponse(BaseModel):
    data: date
    batidas: list[BatidaItemResponse]

    class Config:
        from_attributes = True


class HistoricoPontoResponse(BaseModel):
    colaborador_id: Optional[str]
    empresa_id: Optional[str]
    data_inicio: date
    data_fim: date
    dias: list[DiaHistoricoResponse]

    class Config:
        from_attributes = True
