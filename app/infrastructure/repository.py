"""
Repositorios: traducen entre modelos de persistencia (ORM) y
entidades de dominio (app.core.entities).

Application depende de estas funciones, nunca al revés.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.entities import Event, Hold, HoldStatus, Seat
from app.infrastructure.models import EventModel, HoldModel, SeatModel


def _event_from_model(m: EventModel) -> Event:
    return Event(
        id=m.id,
        name=m.name,
        starts_at=m.starts_at,
        ends_at=m.ends_at,
    )


def _seat_from_model(m: SeatModel) -> Seat:
    return Seat(
        id=m.id,
        event_id=m.event_id,
        label=m.label,
    )


def _hold_from_model(m: HoldModel) -> Hold:
    return Hold(
        id=m.id,
        event_id=m.event_id,
        seat_id=m.seat_id,
        user_id=m.user_id,
        status=HoldStatus(m.status),
        created_at=m.created_at,
    )


def listar_eventos(session: Session) -> list[Event]:
    modelos = session.scalars(select(EventModel)).all()
    return [_event_from_model(m) for m in modelos]


def obtener_evento(session: Session, event_id: str) -> Event | None:
    m = session.get(EventModel, event_id)
    return _event_from_model(m) if m else None


def listar_butacas(session: Session, event_id: str) -> list[Seat]:
    modelos = session.scalars(
        select(SeatModel).where(SeatModel.event_id == event_id)
    ).all()
    return [_seat_from_model(m) for m in modelos]


def obtener_butaca(session: Session, seat_id: str) -> Seat | None:
    m = session.get(SeatModel, seat_id)
    return _seat_from_model(m) if m else None


def retenciones_activas_de_butaca(
    session: Session, event_id: str, seat_id: str
) -> list[Hold]:
    modelos = session.scalars(
        select(HoldModel).where(
            HoldModel.event_id == event_id,
            HoldModel.seat_id == seat_id,
        )
    ).all()
    return [_hold_from_model(m) for m in modelos]


def retenciones_ocupantes_de_usuario(
    session: Session, event_id: str, user_id: str
) -> list[Hold]:
    modelos = session.scalars(
        select(HoldModel).where(
            HoldModel.event_id == event_id,
            HoldModel.user_id == user_id,
            HoldModel.status.in_(
                [
                    HoldStatus.ACTIVE.value,
                    HoldStatus.CONFIRMED.value,
                ]
            ),
        )
    ).all()

    return [_hold_from_model(m) for m in modelos]


def crear_retencion(
    session: Session,
    event_id: str,
    seat_id: str,
    user_id: str,
    demora_didactica_seg: float = 0.0,
) -> Hold:
    """
    Inserta una nueva retención.

    El parámetro demora_didactica_seg existe únicamente para poder
    ensanchar la ventana de la condición de carrera durante la
    demostración de la Semana 1 (tests/test_race_demo.py). En
    producción no debería usarse (o su valor por defecto debe ser 0).
    """
    if demora_didactica_seg:
        import time

        time.sleep(demora_didactica_seg)

    hold = HoldModel(
        event_id=event_id,
        seat_id=seat_id,
        user_id=user_id,
        status=HoldStatus.ACTIVE.value,
    )
    session.add(hold)
    session.commit()
    session.refresh(hold)
    return _hold_from_model(hold)


def obtener_retencion(session: Session, hold_id: str) -> Hold | None:
    m = session.get(HoldModel, hold_id)
    return _hold_from_model(m) if m else None


def confirmar_retencion(session: Session, hold_id: str) -> Hold | None:
    m = session.get(HoldModel, hold_id)
    if m is None:
        return None

    m.status = HoldStatus.CONFIRMED.value
    session.commit()
    session.refresh(m)
    return _hold_from_model(m)


def sembrar_datos_demo(session: Session) -> None:
    """Carga un evento y unas butacas de ejemplo si la base está vacía."""
    if session.scalars(select(EventModel)).first() is not None:
        return

    evento = EventModel(
        id="evento-demo",
        name="Recital de ejemplo",
        starts_at=datetime.now(timezone.utc) + timedelta(days=7, hours=20),
ends_at=datetime.now(timezone.utc) + timedelta(days=7, hours=22),
    )
    session.add(evento)

    for i in range(1, 6):
        session.add(
            SeatModel(
                id=f"butaca-{i}",
                event_id=evento.id,
                label=f"A{i}",
            )
        )

    session.commit()