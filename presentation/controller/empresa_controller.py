from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from infra.db.database import get_db
from infra.repositories.empresa_repository import EmpresaRepository

from application.use_cases.empresa.cadastro_empresa_usecase import CadastroEmpresaUseCase
from application.use_cases.empresa.get_empresa_usecase import GetEmpresaUseCase
from application.use_cases.empresa.edicao_empresa_usecase import EdicaoEmpresaUseCase

from presentation.schema.requests.cadastro_empresa_request import CadastroEmpresaRequest
from presentation.schema.requests.edicao_empresa_request import EdicaoEmpresaRequest
from presentation.schema.responses.empresa_response import EmpresaResponse
from presentation.dependencies.auth import get_current_colaborador, require_manager

router = APIRouter(prefix="/empresa", tags=["Empresa"])


@router.post("", response_model=EmpresaResponse, status_code=201)
def cadastrar_empresa(body: CadastroEmpresaRequest, db: Session = Depends(get_db)):
    repo = EmpresaRepository(db)
    usecase = CadastroEmpresaUseCase(repo)
    return usecase.executar(
        cnpj=body.cnpj,
        razao_social=body.razao_social,
        endereco=body.endereco,
        limite_hora=body.limite_hora,
    )


@router.get("", response_model=list[EmpresaResponse])
def listar_empresas(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    repo = EmpresaRepository(db)
    usecase = GetEmpresaUseCase(repo)
    return usecase.listar()


@router.get("/{cnpj}", response_model=EmpresaResponse)
def buscar_empresa(
    cnpj: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_colaborador),
):
    repo = EmpresaRepository(db)
    usecase = GetEmpresaUseCase(repo)
    return usecase.por_cnpj(cnpj)


@router.put("/{cnpj}", response_model=EmpresaResponse)
def editar_empresa(
    cnpj: str,
    body: EdicaoEmpresaRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    repo = EmpresaRepository(db)
    usecase = EdicaoEmpresaUseCase(repo)
    return usecase.executar(
        requester_cnpj=payload["empresa_id"],
        target_cnpj=cnpj,
        razao_social=body.razao_social,
        endereco=body.endereco,
        limite_hora=body.limite_hora,
    )


@router.delete("/{cnpj}", response_model=EmpresaResponse)
def desativar_empresa(
    cnpj: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_manager),
):
    repo = EmpresaRepository(db)
    usecase = EdicaoEmpresaUseCase(repo)
    return usecase.desativar(
        requester_cnpj=payload["empresa_id"],
        target_cnpj=cnpj,
    )
