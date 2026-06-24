from fastapi import HTTPException

from infra.repositories.empresa_repository import EmpresaRepository
from domains.models.empresa import Empresa


class CadastroEmpresaUseCase:

    def __init__(self, repo: EmpresaRepository):
        self.repo = repo

    def executar(self, cnpj: str, razao_social: str, endereco: str, limite_hora: int) -> Empresa:
        if self.repo.buscar_por_cnpj(cnpj):
            raise HTTPException(status_code=409, detail="Empresa já cadastrada com este CNPJ.")
        empresa = Empresa(
            cnpj=cnpj,
            razao_social=razao_social,
            endereco=endereco,
            limite_hora=limite_hora,
            status=True,
        )
        return self.repo.criar(empresa)
