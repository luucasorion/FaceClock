import csv
import io
from collections import OrderedDict, defaultdict
from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from infra.db.database import get_db
from infra.repositories.batida_ponto_repository import BatidaPontoRepository
from infra.repositories.colaborador_repository import ColaboradorRepository
from infra.repositories.empresa_repository import EmpresaRepository

from application.use_cases.relatorio.historico_colaborador_usecase import (
    HistoricoColaboradorUseCase,
)
from application.use_cases.relatorio.horas_trabalhadas_usecase import (
    DiaPontoInput,
    HorasTrabalhadasUseCase,
)

from presentation.schema.responses.historico_ponto_response import (
    HistoricoPontoResponse,
)
from presentation.schema.responses.historico_response import (
    HistoricoResponse,
)
from presentation.schema.responses.resumo_diario_response import (
    ResumoDiarioResponse,
)
from presentation.schema.responses.relatorio_empresa_response import (
    ColaboradorRelatorioItem,
    PeriodoResponse,
    RelatorioEmpresaResponse,
)
from presentation.dependencies.auth import get_current_colaborador, require_manager

router = APIRouter(prefix="/relatorio", tags=["Relatorio"])


# ----------------------------------------------------------------------
# Internal orchestration glue (controller-scoped, not a use case)
# ----------------------------------------------------------------------

def _agrupar_dias_por_colaborador(
    batidas: list,
) -> "OrderedDict[str, list[DiaPontoInput]]":
    """Group a flat, batida-ASC list into per-collaborator DiaPontoInput lists.

    Collaborators are NEVER mixed inside a single DiaPontoInput, so the
    index-pairing performed by HorasTrabalhadasUseCase stays correct.
    Insertion order is preserved for stable output ordering.
    """

    # colaborador_id -> (day -> [datetimes])
    por_colaborador: "OrderedDict[str, OrderedDict[date, list[datetime]]]" = (
        OrderedDict()
    )

    for batida in batidas:
        dia = batida.batida.date()
        dias = por_colaborador.setdefault(batida.colaborador_id, OrderedDict())
        dias.setdefault(dia, []).append(batida.batida)

    resultado: "OrderedDict[str, list[DiaPontoInput]]" = OrderedDict()
    for colaborador_id, dias in por_colaborador.items():
        resultado[colaborador_id] = [
            DiaPontoInput(data=dia, batidas=timestamps)
            for dia, timestamps in dias.items()
        ]

    return resultado


def _relatorio_para_csv(relatorio: RelatorioEmpresaResponse) -> str:
    """Flatten the report into one CSV row per collaborator/day."""

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "colaborador_id",
            "nome",
            "data",
            "total_trabalhado_minutos",
            "overtime_minutos",
            "excedeu_limite",
        ]
    )

    for item in relatorio.colaboradores:
        for dia in item.horas.dias:
            writer.writerow(
                [
                    item.colaborador_id,
                    item.nome,
                    dia.data.isoformat(),
                    dia.total_trabalhado_minutos,
                    dia.overtime_minutos,
                    dia.excedeu_limite,
                ]
            )

    return buffer.getvalue()


# ----------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------

@router.get("/historico", response_model=HistoricoPontoResponse)
def historico_proprio(
    data_inicio: datetime = Query(...),
    data_fim: datetime = Query(...),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    # BR06: identity comes from the token; BatidaPonto.colaborador_id holds CPF.
    usecase = HistoricoColaboradorUseCase(BatidaPontoRepository(db))
    return usecase.historico_colaborador(payload["cpf"], data_inicio, data_fim)


@router.get("/historico/paginado", response_model=HistoricoResponse)
def historico_proprio_paginado(
    data_inicio: datetime = Query(...),
    data_fim: datetime = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    # BR06: identity comes from the token; BatidaPonto.colaborador_id holds CPF.
    batida_repo = BatidaPontoRepository(db)

    items = batida_repo.listar_por_colaborador(
        payload["cpf"],
        data_inicio,
        data_fim,
        page=page,
        page_size=page_size,
    )
    total = batida_repo.contar_por_colaborador(
        payload["cpf"], data_inicio, data_fim
    )

    return HistoricoResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get("/dia", response_model=ResumoDiarioResponse)
def resumo_diario_proprio(
    data: date | None = Query(None),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    # BR06: identity comes from the token; BatidaPonto.colaborador_id holds CPF.
    # Default to "today" in UTC, matching how BatidaPonto.batida is stored.
    dia = data or datetime.utcnow().date()

    usecase = HistoricoColaboradorUseCase(BatidaPontoRepository(db))
    batidas = usecase.resumo_diario(payload["cpf"], dia)

    return ResumoDiarioResponse(
        colaborador_id=payload["cpf"],
        data=dia,
        total=len(batidas),
        batidas=batidas,
    )


@router.get("/empresa/{empresa_id}")
def relatorio_empresa(
    empresa_id: str,
    data_inicio: datetime = Query(...),
    data_fim: datetime = Query(...),
    formato: Literal["json", "csv"] = "json",
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    # BR06: a manager may only read their own company's report.
    if empresa_id != payload["empresa_id"]:
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito à própria empresa",
        )

    batida_repo = BatidaPontoRepository(db)
    colaborador_repo = ColaboradorRepository(db)
    empresa_repo = EmpresaRepository(db)

    empresa = empresa_repo.buscar_por_cnpj(empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    limite_hora = empresa.limite_hora  # Empresa.limite_hora is stored in HOURS

    horas_usecase = HorasTrabalhadasUseCase()
    historico_usecase = HistoricoColaboradorUseCase(batida_repo)

    batidas = batida_repo.listar_por_empresa(empresa_id, data_inicio, data_fim)
    dias_por_colaborador = _agrupar_dias_por_colaborador(batidas)

    colaboradores: list[ColaboradorRelatorioItem] = []
    for colaborador_id, dias in dias_por_colaborador.items():
        horas = horas_usecase.executar(dias, limite_hora)
        historico = historico_usecase.historico_colaborador(
            colaborador_id, data_inicio, data_fim
        )

        colaborador = colaborador_repo.buscar_por_cpf(colaborador_id)
        nome = colaborador.nome if colaborador else colaborador_id

        colaboradores.append(
            ColaboradorRelatorioItem(
                colaborador_id=colaborador_id,
                nome=nome,
                horas=horas,
                historico=historico,
            )
        )

    relatorio = RelatorioEmpresaResponse(
        empresa_id=empresa_id,
        periodo=PeriodoResponse(
            data_inicio=data_inicio.date(),
            data_fim=data_fim.date(),
        ),
        colaboradores=colaboradores,
    )

    if formato == "csv":
        conteudo = _relatorio_para_csv(relatorio)
        return Response(
            content=conteudo,
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="relatorio_{empresa_id}.csv"'
                )
            },
        )

    return relatorio
