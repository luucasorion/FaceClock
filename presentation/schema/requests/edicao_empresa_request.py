from pydantic import BaseModel
from typing import Optional


class EdicaoEmpresaRequest(BaseModel):
    razao_social: Optional[str] = None
    endereco: Optional[str] = None
    limite_hora: Optional[int] = None
