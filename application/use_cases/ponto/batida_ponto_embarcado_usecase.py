from datetime import datetime

from fastapi import HTTPException, status

from domains.models.batida_ponto import BatidaPonto
from application.use_cases.ponto.batida_ponto_usecase import INTERVALO_MINIMO
from application.services.facial_service import LIMIAR_RECONHECIMENTO


class BatidaPontoEmbarcadoUseCase:

    def __init__(
        self,
        colaborador_repository,
        batida_repository,
        facial_service
    ):
        self.colaborador_repository = colaborador_repository
        self.batida_repository = batida_repository
        self.facial_service = facial_service

    def execute(
        self,
        imagem: bytes,
        geo: str | None = None
    ):

        try:
            embedding_atual = self.facial_service.gerar_embedding(
                imagem
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Imagem inválida ou nenhum rosto detectado"
            )

        colaboradores = self.colaborador_repository.listar()

        melhor_colaborador = None
        melhor_similaridade = 0

        for colaborador in colaboradores:

            if not colaborador.facial:
                continue

            try:

                if len(embedding_atual) != len(colaborador.facial):
                    continue

                similaridade = (
                    self.facial_service.calcular_similaridade(
                        embedding_atual,
                        colaborador.facial
                    )
                )

                if similaridade > melhor_similaridade:
                    melhor_similaridade = similaridade
                    melhor_colaborador = colaborador

            except Exception:
                continue

        if melhor_colaborador is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhum colaborador compatível encontrado"
            )

        if melhor_similaridade < LIMIAR_RECONHECIMENTO:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Pessoa não reconhecida"
            )

        ultima = (
            self.batida_repository
            .buscar_ultima_por_colaborador(melhor_colaborador.cpf)
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
            colaborador_id=melhor_colaborador.cpf,
            geo=geo
        )

        self.batida_repository.salvar(
            batida
        )

        return {
            "nome": melhor_colaborador.nome,
            "similaridade": round(
                melhor_similaridade,
                4
            ),
            "mensagem": "Ponto registrado com sucesso"
        }