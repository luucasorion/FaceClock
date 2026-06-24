from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from infra.security.token_service import TokenService
from infra.db.database import get_db
from infra.repositories.colaborador_repository import ColaboradorRepository

security = HTTPBearer()
token_service = TokenService()


def get_current_colaborador(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return token_service.validar_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_manager(
    payload: dict = Depends(get_current_colaborador),
    db: Session = Depends(get_db),
) -> dict:
    repo = ColaboradorRepository(db)
    colaborador = repo.buscar_por_login(payload["sub"])
    if not colaborador or not colaborador.gerente:
        raise HTTPException(status_code=403, detail="Acesso restrito a gerentes")
    return payload
