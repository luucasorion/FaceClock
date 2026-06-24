from datetime import datetime

from application.use_cases.relatorio._agrupamento import agrupar_por_dia
from presentation.schema.responses.historico_ponto_response import (
    HistoricoPontoResponse,
)


class HistoricoEmpresaUseCase:

    def __init__(self, batida_ponto_repository):
        self.batida_ponto_repository = batida_ponto_repository

    def historico_empresa(
        self,
        empresa_id: str,
        data_inicio: datetime,
        data_fim: datetime,
    ) -> HistoricoPontoResponse:

        batidas = self.batida_ponto_repository.listar_por_empresa(
            empresa_id, data_inicio, data_fim
        )

        dias = agrupar_por_dia(batidas)

        return HistoricoPontoResponse(
            colaborador_id=None,
            empresa_id=empresa_id,
            data_inicio=data_inicio.date(),
            data_fim=data_fim.date(),
            dias=dias,
        )
