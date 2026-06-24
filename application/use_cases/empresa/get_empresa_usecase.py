from fastapi import HTTPException

from infra.repositories.empresa_repository import EmpresaRepository
from domains.models.empresa import Empresa


class GetEmpresaUseCase:

    def __init__(self, repo: EmpresaRepository):
        self.repo = repo

    def por_cnpj(self, cnpj: str) -> Empresa:
        empresa = self.repo.buscar_por_cnpj(cnpj)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        return empresa

    def listar(self) -> list[Empresa]:
        return self.repo.listar()
