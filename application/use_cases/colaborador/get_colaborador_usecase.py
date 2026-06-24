from fastapi import HTTPException

from infra.repositories.colaborador_repository import ColaboradorRepository
from domains.models.colaborador import Colaborador


class GetColaboradorUseCase:

    def __init__(self, repo: ColaboradorRepository):
        self.repo = repo

    def por_login(self, login: str) -> Colaborador:
        colaborador = self.repo.buscar_por_login(login)
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado.")
        return colaborador

    def listar_por_empresa(self, empresa_id: str) -> list[Colaborador]:
        return self.repo.listar_por_empresa(empresa_id)
