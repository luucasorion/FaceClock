from collections import defaultdict
from datetime import date

from presentation.schema.responses.historico_ponto_response import (
    BatidaItemResponse,
    DiaHistoricoResponse,
)


def agrupar_por_dia(batidas: list) -> list[DiaHistoricoResponse]:
    """Group a flat list of BatidaPonto records into per-day buckets.

    Tipo derivation is 1-based per (day, collaborator): odd position =
    "entrada", even position = "saida". Batidas must arrive ordered by
    batida ASC.

    The day bucket groups all collaborators' punches under the same date
    for display, but the position counter that drives tipo is scoped per
    collaborator, so the entrada/saida sequence is always correct even
    when the empresa path mixes multiple collaborators in one call.
    """

    buckets: dict[date, list[BatidaItemResponse]] = defaultdict(list)
    posicoes: dict[tuple[date, str], int] = defaultdict(int)

    for batida in batidas:
        dia = batida.batida.date()
        chave = (dia, batida.colaborador_id)
        posicoes[chave] += 1  # 1-based per collaborator within the day
        posicao = posicoes[chave]
        tipo = "entrada" if posicao % 2 != 0 else "saida"
        buckets[dia].append(
            BatidaItemResponse(
                id=batida.id,
                colaborador_id=batida.colaborador_id,
                geo=batida.geo,
                batida=batida.batida,
                tipo=tipo,
            )
        )

    return [
        DiaHistoricoResponse(data=dia, batidas=batidas_do_dia)
        for dia, batidas_do_dia in sorted(buckets.items())
    ]
