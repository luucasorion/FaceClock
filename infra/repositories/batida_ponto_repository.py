from datetime import datetime

from sqlalchemy.orm import Session

from domains.models.batida_ponto import BatidaPonto
from domains.models.colaborador import Colaborador


class BatidaPontoRepository:

    def __init__(self, db: Session):
        self.db = db

    def salvar(self, batida):
        self.db.add(batida)
        self.db.commit()
        self.db.refresh(batida)

        return batida

    def buscar_ultima_por_colaborador(
        self,
        colaborador_id: str,
    ) -> BatidaPonto | None:

        return (
            self.db.query(BatidaPonto)
            .filter(BatidaPonto.colaborador_id == colaborador_id)
            .order_by(BatidaPonto.batida.desc())
            .first()
        )

    def listar_por_colaborador(
        self,
        colaborador_id: str,
        data_inicio: datetime,
        data_fim: datetime,
    ) -> list[BatidaPonto]:

        return (
            self.db.query(BatidaPonto)
            .filter(
                BatidaPonto.colaborador_id == colaborador_id,
                BatidaPonto.batida >= data_inicio,
                BatidaPonto.batida <= data_fim,
            )
            .order_by(BatidaPonto.batida.asc())
            .all()
        )

    def listar_por_empresa(
        self,
        empresa_id: str,
        data_inicio: datetime,
        data_fim: datetime,
    ) -> list[BatidaPonto]:

        return (
            self.db.query(BatidaPonto)
            .join(Colaborador, BatidaPonto.colaborador_id == Colaborador.cpf)
            .filter(
                Colaborador.empresa_id == empresa_id,
                BatidaPonto.batida >= data_inicio,
                BatidaPonto.batida <= data_fim,
            )
            .order_by(BatidaPonto.batida.asc())
            .all()
        )