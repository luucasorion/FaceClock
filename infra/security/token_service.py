import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError


class TokenService:
    def gerar_token(self, payload: dict) -> str:
        secret = os.getenv("JWT_SECRET", "change_me_in_production")
        expiry = int(os.getenv("JWT_EXPIRY_MINUTES", "60"))
        data = payload.copy()
        data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expiry)
        return jwt.encode(data, secret, algorithm="HS256")

    def validar_token(self, token: str) -> dict:
        secret = os.getenv("JWT_SECRET", "change_me_in_production")
        try:
            return jwt.decode(token, secret, algorithms=["HS256"])
        except JWTError as e:
            raise ValueError(f"Token inválido: {e}")
