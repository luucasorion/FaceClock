from datetime import date

from pydantic import BaseModel

from presentation.schema.responses.historico_ponto_response import (
    HistoricoPontoResponse,
)
from presentation.schema.responses.horas_trabalhadas_response import (
    HorasTrabalhadasResponse,
)


class PeriodoResponse(BaseModel):
    data_inicio: date
    data_fim: date

    class Config:
        from_attributes = True


class ColaboradorRelatorioItem(BaseModel):
    colaborador_id: str
    nome: str
    horas: HorasTrabalhadasResponse
    historico: HistoricoPontoResponse

    class Config:
        from_attributes = True


class RelatorioEmpresaResponse(BaseModel):
    empresa_id: str
    periodo: PeriodoResponse
    colaboradores: list[ColaboradorRelatorioItem]

    class Config:
        from_attributes = True
