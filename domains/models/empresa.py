from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.orm import relationship

from infra.db.base import Base


class Empresa(Base):
    __tablename__ = "empresas"

    cnpj = Column(String, primary_key=True)

    razao_social = Column(String, nullable=False)

    endereco = Column(String, nullable=False)

    limite_hora = Column(Integer, nullable=False)

    status = Column(Boolean, default=True)

    colaboradores = relationship(
        "Colaborador",
        back_populates="empresa"
    )