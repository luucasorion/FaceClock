from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from infra.security.token_service import TokenService

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
) -> dict:
    if not payload.get("gerente"):
        raise HTTPException(status_code=403, detail="Acesso restrito a gerentes")
    return payload
