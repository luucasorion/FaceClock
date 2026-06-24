from pydantic import BaseModel


class ColaboradorResponse(BaseModel):
    cpf: str
    nome: str
    login: str
    empresa_id: str
    status: bool
    gerente: bool

    class Config:
        from_attributes = True
