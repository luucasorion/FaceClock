from fastapi import HTTPException

from infra.repositories.empresa_repository import EmpresaRepository
from application.services.hash_service import HashService
from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador


class CadastroEmpresaUseCase:

    def __init__(self, repo: EmpresaRepository, hash_service: HashService):
        self.repo = repo
        self.hash_service = hash_service

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
        gestor = Colaborador(
            cpf="gestor_" + cnpj,
            login=cnpj,
            nome=razao_social,
            # TODO(AUTHZ-4): predictable bootstrap credential (senha == razao_social). Force password rotation on first manager login. Out of scope for AUTHZ-3.
            senha=self.hash_service.hash(razao_social),
            gerente=True,
            facial=None,
            empresa_id=cnpj,
            status=True,
        )
        return self.repo.criar_com_gestor(empresa, gestor)
