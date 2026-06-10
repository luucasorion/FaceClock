import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from infra.db.base import Base


class BatidaPonto(Base):
    __tablename__ = "batidas_ponto"

    id = Column(
    String,
    primary_key=True,
    default=lambda: str(uuid.uuid4())
)

    colaborador_id = Column(
        String,
        ForeignKey("colaboradores.cpf"),
        nullable=False
    )

    geo = Column(String, nullable=True)

    batida = Column(
        DateTime,
        default=datetime.utcnow
    )

    colaborador = relationship(
        "Colaborador",
        back_populates="batidas"
    )