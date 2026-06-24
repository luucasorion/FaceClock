from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class DiaPontoInput:
    """Per-day input for the worked-hours calculation.

    Attributes:
        data: the calendar day the punches belong to.
        batidas: punch timestamps for that day, already sorted ASC.
                 Pairs are formed by index: (batidas[0], batidas[1]) is the
                 first entrada/saida, (batidas[2], batidas[3]) the second, etc.
    """
    data: date
    batidas: list[datetime] = field(default_factory=list)


@dataclass
class AnomaliaResult:
    batida: datetime
    motivo: str


@dataclass
class DiaHorasResult:
    data: date
    total_trabalhado_minutos: int
    overtime_minutos: int
    excedeu_limite: bool
    anomalias: list[AnomaliaResult] = field(default_factory=list)


@dataclass
class HorasTrabalhadasResult:
    limite_hora: int
    dias: list[DiaHorasResult] = field(default_factory=list)


_MOTIVO_BATIDA_IMPAR = "Batida sem par (entrada ou saída faltante)"


class HorasTrabalhadasUseCase:
    """Pure worked-hours / overtime calculator (RF11, BR04, BR05).

    Layer-neutral: no repository, HTTP, FastAPI, SQLAlchemy or presentation
    imports. Returns dataclass instances whose field names match the response
    DTOs so the controller can map them directly.

    Input contract:
        dias: list[DiaPontoInput] (or any iterable of objects exposing
              `data: date` and `batidas: list[datetime]` sorted ASC).
        limite_hora: int, the daily limit in HOURS (matches Empresa.limite_hora).

    Unit-testable with plain lists of datetimes, no DB models required.
    """

    def executar(
        self,
        dias: list[DiaPontoInput],
        limite_hora: int,
    ) -> HorasTrabalhadasResult:
        limite_minutos = limite_hora * 60

        resultado_dias: list[DiaHorasResult] = []
        for dia in dias:
            batidas = dia.batidas

            total_trabalhado_minutos = 0
            anomalias: list[AnomaliaResult] = []

            par_completo = len(batidas) - (len(batidas) % 2)
            for i in range(0, par_completo, 2):
                entrada = batidas[i]
                saida = batidas[i + 1]
                total_trabalhado_minutos += int(
                    (saida - entrada).total_seconds() // 60
                )

            if len(batidas) % 2 != 0:
                anomalias.append(
                    AnomaliaResult(
                        batida=batidas[-1],
                        motivo=_MOTIVO_BATIDA_IMPAR,
                    )
                )

            # BR04: overtime never negative.
            overtime_minutos = max(0, total_trabalhado_minutos - limite_minutos)
            # BR05: limit exceeded only when there is overtime.
            excedeu_limite = overtime_minutos > 0

            resultado_dias.append(
                DiaHorasResult(
                    data=dia.data,
                    total_trabalhado_minutos=total_trabalhado_minutos,
                    overtime_minutos=overtime_minutos,
                    excedeu_limite=excedeu_limite,
                    anomalias=anomalias,
                )
            )

        return HorasTrabalhadasResult(
            limite_hora=limite_hora,
            dias=resultado_dias,
        )
