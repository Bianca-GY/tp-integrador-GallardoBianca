from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.api.schemas import CreateHoldIn, EventOut, HoldOut, SeatOut

from app.application import use_cases

from app.application.use_cases import (
    ButacaNoEncontradaError,
    EventoNoEncontradoError,
    RetencionDuplicadaError,
    RetencionNoEncontradaError,
)

from app.infrastructure.db import get_session


router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get(
    "/events",
    response_model=list[EventOut],
)
def listar_eventos(
    session: Session = Depends(get_session),
):
    return use_cases.listar_eventos(session)


@router.get(
    "/events/{event_id}",
    response_model=EventOut,
    responses={
        404: {
            "description": "Evento no encontrado",
        },
    },
)
def obtener_evento(
    event_id: str,
    session: Session = Depends(get_session),
):
    try:
        return use_cases.obtener_evento(session, event_id)
    except EventoNoEncontradoError:
        raise HTTPException(
            status_code=404,
            detail="Evento no encontrado",
        )


@router.get(
    "/events/{event_id}/seats",
    response_model=list[SeatOut],
    responses={
        404: {
            "description": "Evento no encontrado",
        },
    },
)
def listar_butacas(
    event_id: str,
    session: Session = Depends(get_session),
):
    try:
        return use_cases.listar_butacas(session, event_id)
    except EventoNoEncontradoError:
        raise HTTPException(
            status_code=404,
            detail="Evento no encontrado",
        )


@router.post(
    "/events/{event_id}/holds",
    response_model=HoldOut,
    status_code=201,
    responses={
    400: {
        "description": "Error al interpretar el cuerpo de la solicitud",
    },
    404: {
        "description": "Evento o butaca no encontrados",
    },
    409: {
            "description": (
                "Conflicto: la butaca ya está ocupada "
                "o el usuario alcanzó el límite de cuatro butacas "
                "ocupantes en el evento"
            ),
        },
    },
)
def crear_retencion(
    event_id: str,
    body: CreateHoldIn,
    session: Session = Depends(get_session),
):
    try:
        return use_cases.crear_retencion(
            session,
            event_id,
            seat_id=body.seat_id,
            user_id=body.user_id,
        )

    except EventoNoEncontradoError:
        raise HTTPException(
            status_code=404,
            detail="Evento no encontrado",
        )

    except ButacaNoEncontradaError:
        raise HTTPException(
            status_code=404,
            detail="Butaca no encontrada",
        )

    except RetencionDuplicadaError:
        raise HTTPException(
            status_code=409,
            detail="La butaca ya tiene una retención activa",
        )

    except use_cases.LimiteButacasUsuarioError:
        raise HTTPException(
            status_code=409,
            detail=(
                "El usuario no puede tener más de cuatro "
                "butacas ocupantes en el mismo evento (RET-002)."
            ),
        )


@router.post(
    "/holds/{hold_id}/confirm",
    response_model=HoldOut,
    responses={
        404: {
            "description": "Retención no encontrada",
        },
    },
)
def confirmar_retencion(
    hold_id: str,
    session: Session = Depends(get_session),
):
    try:
        return use_cases.confirmar_retencion(
            session,
            hold_id,
        )

    except RetencionNoEncontradaError:
        raise HTTPException(
            status_code=404,
            detail="Retención no encontrada",
        )