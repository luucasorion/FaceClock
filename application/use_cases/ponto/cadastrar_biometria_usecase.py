from fastapi import HTTPException, status


class CadastrarBiometriaUseCase:

    def __init__(
        self,
        colaborador_repository,
        facial_service
    ):
        self.colaborador_repository = colaborador_repository
        self.facial_service = facial_service

    def execute(
        self,
        login: str,
        imagem: bytes
    ):

        colaborador = (
            self.colaborador_repository
            .buscar_por_login(login)
        )

        if not colaborador:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Colaborador não encontrado"
            )

        embedding = (
            self.facial_service
            .gerar_embedding(imagem)
        )

        colaborador.facial = embedding

        self.colaborador_repository.atualizar(
            colaborador
        )

        return {
            "mensagem": "Biometria cadastrada com sucesso"
        }