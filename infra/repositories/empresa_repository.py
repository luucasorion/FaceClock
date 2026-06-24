from sqlalchemy.orm import Session

from domains.models.empresa import Empresa


class EmpresaRepository:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, empresa: Empresa) -> Empresa:
        self.db.add(empresa)
        self.db.commit()
        self.db.refresh(empresa)
        return empresa

    def buscar_por_cnpj(self, cnpj: str) -> Empresa | None:
        return self.db.query(Empresa).filter(Empresa.cnpj == cnpj).first()

    def listar(self) -> list[Empresa]:
        return self.db.query(Empresa).all()

    def atualizar(self, empresa: Empresa) -> Empresa:
        self.db.commit()
        self.db.refresh(empresa)
        return empresa

    def desativar(self, empresa: Empresa) -> Empresa:
        empresa.status = False
        self.db.commit()
        self.db.refresh(empresa)
        return empresa
