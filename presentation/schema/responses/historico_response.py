from pydantic import BaseModel

from presentation.schema.responses.batida_ponto_response import (
    BatidaPontoResponse,
)


class HistoricoResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[BatidaPontoResponse]
