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
        page: int | None = None,
        page_size: int | None = None,
    ) -> list[BatidaPonto]:

        query = (
            self.db.query(BatidaPonto)
            .filter(
                BatidaPonto.colaborador_id == colaborador_id,
                BatidaPonto.batida >= data_inicio,
                BatidaPonto.batida <= data_fim,
            )
            .order_by(BatidaPonto.batida.asc())
        )

        if page is not None and page_size is not None:
            query = query.offset((page - 1) * page_size).limit(page_size)

        return query.all()

    def contar_por_colaborador(
        self,
        colaborador_id: str,
        data_inicio: datetime,
        data_fim: datetime,
    ) -> int:

        return (
            self.db.query(BatidaPonto)
            .filter(
                BatidaPonto.colaborador_id == colaborador_id,
                BatidaPonto.batida >= data_inicio,
                BatidaPonto.batida <= data_fim,
            )
            .count()
        )

    def listar_por_empresa(
        self,
        empresa_id: str,
        data_inicio: datetime,
        data_fim: datetime,
        page: int | None = None,
        page_size: int | None = None,
    ) -> list[BatidaPonto]:

        query = (
            self.db.query(BatidaPonto)
            .join(Colaborador, BatidaPonto.colaborador_id == Colaborador.cpf)
            .filter(
                Colaborador.empresa_id == empresa_id,
                BatidaPonto.batida >= data_inicio,
                BatidaPonto.batida <= data_fim,
            )
            .order_by(BatidaPonto.batida.asc())
        )

        if page is not None and page_size is not None:
            query = query.offset((page - 1) * page_size).limit(page_size)

        return query.all()