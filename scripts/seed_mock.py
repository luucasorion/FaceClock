"""Seed mock data for FaceClock: empresas, colaboradores and batidas de ponto.

Idempotent — uses Session.merge(), so re-running updates rows instead of
duplicating them. Punches are cleared and regenerated for the seeded
collaborators so counts stay stable across runs.

Run from the repo root:  python scripts/seed_mock.py

Login for every seeded collaborator is the plaintext password "senha123".
Managers log in with their CNPJ as login (project convention).
"""
import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.services.hash_service import HashService
from domains.models.empresa import Empresa
from domains.models.colaborador import Colaborador
from domains.models.batida_ponto import BatidaPonto
from infra.db.database import SessionLocal

DEFAULT_PASSWORD = "senha123"

# Geo points (lat,lng) for a bit of realism per company location.
GEO = {
    "sp": "-23.5505,-46.6333",   # Sao Paulo
    "rj": "-22.9068,-43.1729",   # Rio de Janeiro
    "bh": "-19.9167,-43.9345",   # Belo Horizonte
}

# (cnpj, razao_social, endereco, limite_hora_min, geo_key, [colaboradores])
# Each colaborador: (cpf, nome, login, gerente)
EMPRESAS = [
    (
        "11222333000181",
        "Nimbus Tecnologia LTDA",
        "Av. Paulista, 1000 - Sao Paulo/SP",
        480,
        "sp",
        [
            ("gestor_11222333000181", "Mariana Lopes", "11222333000181", True),
            ("52998224725", "Carlos Henrique Souza", "carlos.souza", False),
            ("39053344705", "Aline Ferreira", "aline.ferreira", False),
            ("48171623080", "Bruno Carvalho", "bruno.carvalho", False),
        ],
    ),
    (
        "44555666000172",
        "Aurora Servicos Digitais LTDA",
        "Rua da Assembleia, 50 - Rio de Janeiro/RJ",
        480,
        "rj",
        [
            ("gestor_44555666000172", "Rafael Pinto", "44555666000172", True),
            ("16899535009", "Juliana Martins", "juliana.martins", False),
            ("28625984033", "Diego Almeida", "diego.almeida", False),
        ],
    ),
    (
        "77888999000163",
        "Vertex Consultoria LTDA",
        "Av. Afonso Pena, 4000 - Belo Horizonte/MG",
        360,
        "bh",
        [
            ("gestor_77888999000163", "Patricia Gomes", "77888999000163", True),
            ("19245678007", "Felipe Rocha", "felipe.rocha", False),
            ("65498732015", "Camila Nunes", "camila.nunes", False),
        ],
    ),
]


def seed():
    db = SessionLocal()
    hasher = HashService()
    senha_hash = hasher.hash(DEFAULT_PASSWORD)

    colaborador_ids = []
    n_emp = n_col = n_bat = 0

    try:
        for cnpj, razao, endereco, limite, geo_key, colaboradores in EMPRESAS:
            db.merge(Empresa(
                cnpj=cnpj,
                razao_social=razao,
                endereco=endereco,
                limite_hora=limite,
                status=True,
            ))
            n_emp += 1

            for cpf, nome, login, gerente in colaboradores:
                db.merge(Colaborador(
                    cpf=cpf,
                    nome=nome,
                    login=login,
                    senha=senha_hash,
                    status=True,
                    gerente=gerente,
                    facial=None,
                    empresa_id=cnpj,
                ))
                n_col += 1
                colaborador_ids.append((cpf, geo_key))

        db.flush()

        # Regenerate punches only for seeded collaborators (keeps re-runs clean).
        ids = [cpf for cpf, _ in colaborador_ids]
        db.query(BatidaPonto).filter(
            BatidaPonto.colaborador_id.in_(ids)
        ).delete(synchronize_session=False)

        # 5 business days back from today; in/out punches per day.
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        for cpf, geo_key in colaborador_ids:
            geo = GEO[geo_key]
            for d in range(5, 0, -1):
                day = today - timedelta(days=d)
                if day.weekday() >= 5:  # skip weekends
                    continue
                for hour, minute in [(8, 5), (12, 0), (13, 0), (17, 2)]:
                    db.add(BatidaPonto(
                        id=str(uuid.uuid4()),
                        colaborador_id=cpf,
                        geo=geo,
                        batida=day.replace(hour=hour, minute=minute),
                    ))
                    n_bat += 1

        db.commit()
        print(f"Seed OK: {n_emp} empresas, {n_col} colaboradores, {n_bat} batidas.")
        print(f'Senha de todos os colaboradores: "{DEFAULT_PASSWORD}"')
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
