from sqlalchemy.orm import Session

from domains.models.colaborador import Colaborador


class ColaboradorRepository:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, colaborador: Colaborador):

        self.db.add(colaborador)
        self.db.commit()
        self.db.refresh(colaborador)

        return colaborador

    def buscar_por_cpf(self, cpf: str):

        return (
            self.db.query(Colaborador)
            .filter(Colaborador.cpf == cpf)
            .first()
        )

    def buscar_por_login(self, login: str):

        return (
            self.db.query(Colaborador)
            .filter(Colaborador.login == login)
            .first()
        )

    def listar(self):

        return self.db.query(Colaborador).all()

    def deletar(self, colaborador: Colaborador):

        self.db.delete(colaborador)
        self.db.commit()