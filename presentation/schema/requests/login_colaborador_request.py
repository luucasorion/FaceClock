from pydantic import BaseModel


class LoginColaboradorRequest(BaseModel):

    login: str
    senha: str