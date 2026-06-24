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

    def listar_por_empresa(self, empresa_id: str):

        return (
            self.db.query(Colaborador)
            .filter(Colaborador.empresa_id == empresa_id)
            .filter(Colaborador.status == True)
            .all()
        )
    
    def atualizar(self, colaborador: Colaborador):

        self.db.commit()
        self.db.refresh(colaborador)

        return colaborador

    def deletar(self, colaborador: Colaborador):

        colaborador.status = False

        self.db.commit()
        self.db.refresh(colaborador)

        return colaborador

    def contar_gerentes_ativos(self, empresa_id: str) -> int:

        return self.db.query(Colaborador).filter(
            Colaborador.empresa_id == empresa_id,
            Colaborador.gerente == True,
            Colaborador.status == True,
        ).count()