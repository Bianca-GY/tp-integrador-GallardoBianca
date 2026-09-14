from sqlalchemy.orm import Session

from app.core.entities import Event, Hold, Seat
from app.core.rules import (
    LimiteButacasUsuarioError,
    RetencionDuplicadaError,
    validar_creacion_retencion,
    validar_limite_butacas_usuario,
)
from app.infrastructure import repository


class EventoNoEncontradoError(Exception):
    pass


class ButacaNoEncontradaError(Exception):
    pass


class RetencionNoEncontradaError(Exception):
    pass


def listar_eventos(session: Session) -> list[Event]:
    return repository.listar_eventos(session)


def obtener_evento(session: Session, event_id: str) -> Event:
    evento = repository.obtener_evento(session, event_id)

    if evento is None:
        raise EventoNoEncontradoError(event_id)

    return evento


def listar_butacas(session: Session, event_id: str) -> list[Seat]:
    evento = repository.obtener_evento(session, event_id)

    if evento is None:
        raise EventoNoEncontradoError(event_id)

    return repository.listar_butacas(session, event_id)


def crear_retencion(
    session: Session,
    event_id: str,
    seat_id: str,
    user_id: str,
    demora_didactica_seg: float = 0.0,
) -> Hold:
    """
    Caso de uso: crear una retención temporal sobre una butaca.

    Pasos:
    1. Infrastructure recupera evento, butaca y retenciones existentes.
    2. Core evalúa la regla RET-001.
    3. Core evalúa la regla RET-002.
    4. Application decide si continuar.
    5. Infrastructure persiste la nueva retención.

    ADVERTENCIA (Semana 1): entre el paso 1 y el paso 5 existe una
    ventana en la que otra petición concurrente puede violar RET-001.
    Esto es intencional. Ver ADR-001 y tests/test_race_demo.py.
    """
    evento = repository.obtener_evento(session, event_id)

    if evento is None:
        raise EventoNoEncontradoError(event_id)

    butaca = repository.obtener_butaca(session, seat_id)

    if butaca is None or butaca.event_id != event_id:
        raise ButacaNoEncontradaError(seat_id)

    retenciones_existentes = repository.retenciones_activas_de_butaca(
        session,
        event_id,
        seat_id,
    )

    # RET-001: una butaca no puede tener dos retenciones activas.
    validar_creacion_retencion(retenciones_existentes)

    retenciones_usuario = repository.retenciones_ocupantes_de_usuario(
        session,
        event_id,
        user_id,
    )

    # RET-002: el usuario no puede superar cuatro butacas ocupantes
    # en el mismo evento.
    validar_limite_butacas_usuario(retenciones_usuario)

    return repository.crear_retencion(
        session,
        event_id,
        seat_id,
        user_id=user_id,
        demora_didactica_seg=demora_didactica_seg,
    )


def confirmar_retencion(
    session: Session,
    hold_id: str,
) -> Hold:
    hold = repository.confirmar_retencion(session, hold_id)

    if hold is None:
        raise RetencionNoEncontradaError(hold_id)

    return hold