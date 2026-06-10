class BatidaPontoRepository:

    def __init__(self, db):
        self.db = db

    def salvar(self, batida):
        self.db.add(batida)
        self.db.commit()
        self.db.refresh(batida)

        return batida