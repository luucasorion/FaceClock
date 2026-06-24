from pydantic import BaseModel
from typing import Optional


class EdicaoColaboradorRequest(BaseModel):
    nome: Optional[str] = None
    login: Optional[str] = None
    gerente: Optional[bool] = None
    senha: Optional[str] = None
