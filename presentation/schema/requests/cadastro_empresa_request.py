from pydantic import BaseModel


class CadastroEmpresaRequest(BaseModel):
    cnpj: str
    razao_social: str
    endereco: str
    limite_hora: int
