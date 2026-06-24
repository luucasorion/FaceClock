from fastapi import HTTPException

from infra.repositories.empresa_repository import EmpresaRepository
from domains.models.empresa import Empresa


class EdicaoEmpresaUseCase:

    def __init__(self, repo: EmpresaRepository):
        self.repo = repo

    def executar(
        self,
        requester_cnpj: str,
        target_cnpj: str,
        razao_social: str | None,
        endereco: str | None,
        limite_hora: int | None,
    ) -> Empresa:
        if requester_cnpj != target_cnpj:
            raise HTTPException(status_code=403, detail="Acesso negado: você só pode editar sua própria empresa.")
        empresa = self.repo.buscar_por_cnpj(target_cnpj)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        if razao_social is not None:
            empresa.razao_social = razao_social
        if endereco is not None:
            empresa.endereco = endereco
        if limite_hora is not None:
            empresa.limite_hora = limite_hora
        return self.repo.atualizar(empresa)

    def desativar(self, requester_cnpj: str, target_cnpj: str) -> Empresa:
        if requester_cnpj != target_cnpj:
            raise HTTPException(status_code=403, detail="Acesso negado: você só pode desativar sua própria empresa.")
        empresa = self.repo.buscar_por_cnpj(target_cnpj)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")
        return self.repo.desativar(empresa)
