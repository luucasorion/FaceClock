from fastapi import HTTPException

from infra.repositories.colaborador_repository import ColaboradorRepository
from application.services.hash_service import HashService


class EdicaoColaboradorUseCase:

    def __init__(self, repo: ColaboradorRepository, hash_service: HashService):
        self.repo = repo
        self.hash_service = hash_service

    def executar(
        self,
        requester_empresa_id: str,
        requester_login: str,
        target_cpf: str,
        nome: str | None,
        login: str | None,
        gerente: bool | None,
        senha: str | None,
    ):
        colaborador = self.repo.buscar_por_cpf(target_cpf)
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

        if colaborador.empresa_id != requester_empresa_id:
            raise HTTPException(
                status_code=403,
                detail="Acesso negado: colaborador pertence a outra empresa.",
            )

        if login is not None and login != colaborador.login:
            existente = self.repo.buscar_por_login(login)
            if existente:
                raise HTTPException(
                    status_code=409,
                    detail="Login já está em uso por outro colaborador.",
                )

        if nome is not None:
            colaborador.nome = nome
        if login is not None:
            colaborador.login = login
        if gerente is not None:
            colaborador.gerente = gerente
        if senha is not None:
            colaborador.senha = self.hash_service.hash(senha)

        return self.repo.atualizar(colaborador)

    def desativar(
        self,
        requester_empresa_id: str,
        requester_login: str,
        target_cpf: str,
    ):
        colaborador = self.repo.buscar_por_cpf(target_cpf)
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado.")

        if colaborador.empresa_id != requester_empresa_id:
            raise HTTPException(
                status_code=403,
                detail="Acesso negado: colaborador pertence a outra empresa.",
            )

        if colaborador.login == requester_login:
            raise HTTPException(
                status_code=403,
                detail="Não é permitido desativar a própria conta.",
            )

        if colaborador.gerente and self.repo.contar_gerentes_ativos(colaborador.empresa_id) <= 1:
            raise HTTPException(
                status_code=409,
                detail="Não é possível desativar o único gerente ativo da empresa.",
            )

        return self.repo.deletar(colaborador)
