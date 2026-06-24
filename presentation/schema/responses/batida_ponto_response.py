from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BatidaPontoResponse(BaseModel):
    id: str
    colaborador_id: str
    geo: Optional[str]
    batida: datetime

    class Config:
        from_attributes = True
