from pydantic import BaseModel

from presentation.schema.responses.colaborador_response import ColaboradorResponse


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    colaborador: ColaboradorResponse
