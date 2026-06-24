from fastapi import HTTPException, status


class LoginColaboradorUseCase:

    def __init__(
        self,
        colaborador_repository,
        hash_service
    ):

        self.colaborador_repository = colaborador_repository
        self.hash_service = hash_service

    def execute(
        self,
        login: str,
        senha: str
    ):

        colaborador = (
            self.colaborador_repository
            .buscar_por_login(login)
        )

        if not colaborador:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        senha_valida = self.hash_service.verify(
            senha,
            colaborador.senha
        )

        if not senha_valida:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not colaborador.status:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN
            )

        return {
            "cpf": colaborador.cpf,
            "nome": colaborador.nome,
            "login": colaborador.login,
            "empresa_id": colaborador.empresa_id,
            "status": colaborador.status,
            "gerente": colaborador.gerente,
        }