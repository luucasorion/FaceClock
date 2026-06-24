from datetime import date, datetime

from pydantic import BaseModel


class AnomaliaResponse(BaseModel):
    batida: datetime
    motivo: str

    class Config:
        from_attributes = True


class DiaHorasResponse(BaseModel):
    data: date
    total_trabalhado_minutos: int
    overtime_minutos: int
    excedeu_limite: bool
    anomalias: list[AnomaliaResponse]

    class Config:
        from_attributes = True


class HorasTrabalhadasResponse(BaseModel):
    limite_hora: int
    dias: list[DiaHorasResponse]

    class Config:
        from_attributes = True
