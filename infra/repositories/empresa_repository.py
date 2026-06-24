from sqlalchemy.orm import Session

from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador


class EmpresaRepository:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, empresa: Empresa) -> Empresa:
        self.db.add(empresa)
        self.db.commit()
        self.db.refresh(empresa)
        return empresa

    def criar_com_gestor(self, empresa: Empresa, gestor: Colaborador) -> Empresa:
        try:
            self.db.add(empresa)
            self.db.add(gestor)
            self.db.commit()        # single commit -> both persist or neither
            self.db.refresh(empresa)
            return empresa
        except Exception:
            self.db.rollback()      # get_db only close()s; rollback explicitly
            raise

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
