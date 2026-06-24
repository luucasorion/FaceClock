from pydantic import BaseModel


class EdicaoPerfilRequest(BaseModel):
    nome: str | None = None
    login: str | None = None
    senha: str | None = None
