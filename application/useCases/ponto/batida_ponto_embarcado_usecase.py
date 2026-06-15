from fastapi import HTTPException, status

from domains.models.batida_ponto import BatidaPonto


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
        geo: str
    ):

        embedding_atual = self.facial_service.gerar_embedding(
            imagem
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

        print(
            f"Melhor match: "
            f"{melhor_colaborador.nome} "
            f"({melhor_similaridade:.4f})"
        )

        if melhor_similaridade < 0.4:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Pessoa não reconhecida"
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