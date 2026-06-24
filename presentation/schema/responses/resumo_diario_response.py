from datetime import date

from pydantic import BaseModel

from presentation.schema.responses.historico_ponto_response import (
    BatidaItemResponse,
)


class ResumoDiarioResponse(BaseModel):
    colaborador_id: str
    data: date
    total: int
    batidas: list[BatidaItemResponse]

    class Config:
        from_attributes = True
