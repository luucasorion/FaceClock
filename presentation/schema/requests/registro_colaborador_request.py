from pydantic import BaseModel


class RegistroColaboradorRequest(BaseModel):
    cpf: str
    nome: str
    login: str
    senha: str
    empresa_id: str
    facial: list[float]