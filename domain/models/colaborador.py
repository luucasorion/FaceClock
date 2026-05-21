from sqlalchemy import (
    Column,
    String,
    Boolean,
    ForeignKey,
    JSON
)

from sqlalchemy.orm import relationship

from infra.db.base import Base


class Colaborador(Base):
    __tablename__ = "colaboradores"

    cpf = Column(String, primary_key=True)

    nome = Column(String, nullable=False)

    login = Column(
        String,
        unique=True,
        nullable=False
    )

    senha = Column(String, nullable=False)

    empresa_id = Column(
        String,
        ForeignKey("empresas.cnpj"),
        nullable=False
    )

    status = Column(Boolean, default=True)

    facial = Column(JSON, nullable=True)

    empresa = relationship(
        "Empresa",
        back_populates="colaboradores"
    )