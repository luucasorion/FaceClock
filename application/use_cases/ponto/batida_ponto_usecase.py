from datetime import datetime, timedelta

from fastapi import HTTPException, status

from domains.models.batida_ponto import BatidaPonto

# Intervalo mínimo entre batidas de um mesmo colaborador (BR02).
# Fonte única de verdade, reutilizada também no fluxo embarcado.
INTERVALO_MINIMO = timedelta(minutes=5)


class BaterPontoUseCase:

    def __init__(
        self,
        colaborador_repository,
        batida_ponto_repository,
        facial_service
    ):
        self.colaborador_repository = colaborador_repository
        self.batida_ponto_repository = batida_ponto_repository
        self.facial_service = facial_service

    def execute(
        self,
        login: str,
        imagem: bytes,
        geo: str
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

        if not colaborador.status:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Colaborador inativo"
            )

        if len(colaborador.facial) < 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Colaborador não possui biometria facial cadastrada"
            )

        embedding_atual = (
            self.facial_service
            .gerar_embedding(imagem)
        )

        reconhecido = (
            self.facial_service
            .validar_rosto(
                embedding_atual,
                colaborador.facial
            )
        )

        if not reconhecido:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Face não reconhecida"
            )

        ultima = (
            self.batida_ponto_repository
            .buscar_ultima_por_colaborador(colaborador.cpf)
        )

        if (
            ultima is not None
            and datetime.utcnow() - ultima.batida < INTERVALO_MINIMO
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Intervalo mínimo entre batidas é de 5 minutos"
            )

        batida = BatidaPonto(
            colaborador_id=colaborador.cpf,
            geo=geo
        )

        self.batida_ponto_repository.salvar(
            batida
        )

        return {
            "mensagem": "Ponto registrado com sucesso",
            "colaborador": colaborador.nome
        }