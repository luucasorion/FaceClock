from pydantic import BaseModel


class EmpresaResponse(BaseModel):
    cnpj: str
    razao_social: str
    endereco: str
    limite_hora: int
    status: bool

    class Config:
        from_attributes = True
