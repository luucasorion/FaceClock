from fastapi import HTTPException, status

from domains.models.colaborador import Colaborador


class RegistrarColaboradorUseCase:

    def __init__(
        self,
        colaborador_repository,
        hash_service
    ):

        self.colaborador_repository = colaborador_repository
        self.hash_service = hash_service

    def execute(
        self,
        cpf: str,
        nome: str,
        login: str,
        senha: str,
        empresa_id: str,
        facial: list[float]
    ):

        colaborador_existente = (
            self.colaborador_repository
            .buscar_por_cpf(cpf)
        )

        if colaborador_existente:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT
            )

        login_existente = (
            self.colaborador_repository
            .buscar_por_login(login)
        )

        if login_existente:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT
            )

        senha_hash = self.hash_service.hash(senha)

        colaborador = Colaborador(
            cpf=cpf,
            nome=nome,
            login=login,
            senha=senha_hash,
            empresa_id=empresa_id,
            status=True,
            facial=facial
        )

        return self.colaborador_repository.criar(colaborador)