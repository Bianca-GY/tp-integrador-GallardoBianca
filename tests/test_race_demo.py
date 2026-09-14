"""
Demostración didáctica de la condición de carrera pendiente (RET-001).

Este test está marcado con `race_demo` y NO forma parte de la suite
normal (ver pytest.ini). Se ejecuta explícitamente con:

    py -3.12 -m pytest -m race_demo -v

Objetivo pedagógico: mostrar que, tal como está el starter, dos peticiones
concurrentes pueden crear dos retenciones activas para la misma butaca,
violando RET-001, porque el paso "consultar retenciones existentes" y el
paso "insertar la nueva retención" no son atómicos.

Este defecto se mantiene documentado como una limitación de concurrencia.
"""

from datetime import datetime, timedelta
import threading

import pytest

from app.application import use_cases
from app.infrastructure.db import SessionLocal
from app.infrastructure.models import EventModel, SeatModel


def _sembrar_evento_y_butaca():
    session = SessionLocal()
    try:
        evento = EventModel(
            id="evento-race",
            name="Evento para demo de concurrencia",
            starts_at=datetime.utcnow() + timedelta(days=1),
            ends_at=datetime.utcnow() + timedelta(days=1, hours=2),
        )
        session.add(evento)
        session.add(
            SeatModel(
                id="butaca-race",
                event_id=evento.id,
                label="R1",
            )
        )
        session.commit()
    finally:
        session.close()


@pytest.mark.race_demo
def test_dos_peticiones_concurrentes_violan_RET_001():
    _sembrar_evento_y_butaca()

    resultados: list[str] = []
    errores: list[Exception] = []

    def intentar_crear_retencion():
        session = SessionLocal()

        try:
            hold = use_cases.crear_retencion(
                session,
                event_id="evento-race",
                seat_id="butaca-race",
                user_id="usuario-race",
                # Ensancha la ventana entre "consultar" e "insertar"
                # para que la carrera se manifieste de forma confiable.
                demora_didactica_seg=0.3,
            )
            resultados.append(hold.id)

        except Exception as exc:  # noqa: BLE001
            errores.append(exc)

        finally:
            session.close()

    hilo_a = threading.Thread(target=intentar_crear_retencion)
    hilo_b = threading.Thread(target=intentar_crear_retencion)

    hilo_a.start()
    hilo_b.start()

    hilo_a.join()
    hilo_b.join()

    # Si RET-001 estuviera garantizada bajo concurrencia, solamente
    # una de las dos peticiones debería conseguir crear la retención.
    #
    # En el starter actual este assert debe FALLAR, demostrando
    # la condición de carrera pendiente.
    assert len(resultados) == 1, (
        f"RET-001 violada bajo concurrencia: se crearon {len(resultados)} "
        f"retenciones activas para la misma butaca (se esperaba 1). "
        f"Este fallo demuestra la condición de carrera pendiente."
    )