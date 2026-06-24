from datetime import date, datetime, time

from application.use_cases.relatorio._agrupamento import agrupar_por_dia
from presentation.schema.responses.historico_ponto_response import (
    BatidaItemResponse,
    HistoricoPontoResponse,
)


class HistoricoColaboradorUseCase:

    def __init__(self, batida_ponto_repository):
        self.batida_ponto_repository = batida_ponto_repository

    def historico_colaborador(
        self,
        colaborador_id: str,
        data_inicio: datetime,
        data_fim: datetime,
    ) -> HistoricoPontoResponse:

        batidas = self.batida_ponto_repository.listar_por_colaborador(
            colaborador_id, data_inicio, data_fim
        )

        dias = agrupar_por_dia(batidas)

        return HistoricoPontoResponse(
            colaborador_id=colaborador_id,
            empresa_id=None,
            data_inicio=data_inicio.date(),
            data_fim=data_fim.date(),
            dias=dias,
        )

    def resumo_diario(
        self,
        colaborador_id: str,
        dia: date,
    ) -> list[BatidaItemResponse]:
        """Return the ordered punches of a single day for a collaborator.

        Builds an inclusive single-day window and reuses
        ``historico_colaborador`` (which applies the repository's
        ``>= / <=`` filter), then flattens the 0-or-1 day bucket into a
        flat ordered list of ``BatidaItemResponse`` (derived ``tipo`` kept).
        """

        data_inicio = datetime.combine(dia, time.min)
        data_fim = datetime.combine(dia, time.max)

        historico = self.historico_colaborador(
            colaborador_id, data_inicio, data_fim
        )

        batidas: list[BatidaItemResponse] = []
        for dia_bucket in historico.dias:
            batidas.extend(dia_bucket.batidas)

        return batidas
