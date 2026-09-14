from datetime import datetime

import pytest

from app.core.entities import Hold, HoldStatus
from app.core.rules import (
    LimiteButacasUsuarioError,
    RetencionDuplicadaError,
    puede_crear_retencion,
    puede_crear_retencion_usuario,
    validar_creacion_retencion,
    validar_limite_butacas_usuario,
)


def crear_hold(
    seat_id: str,
    status: HoldStatus,
    user_id: str = "usuario-1",
) -> Hold:
    return Hold(
        id=f"hold-{seat_id}",
        event_id="evento-demo",
        seat_id=seat_id,
        user_id=user_id,
        status=status,
        created_at=datetime.utcnow(),
    )


def test_no_permite_crear_si_ya_hay_una_activa():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE),
    ]

    assert puede_crear_retencion(retenciones) is False


def test_permite_crear_si_la_existente_esta_liberada():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.RELEASED),
    ]

    assert puede_crear_retencion(retenciones) is True


def test_validar_creacion_lanza_error_de_dominio():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE),
    ]

    with pytest.raises(RetencionDuplicadaError):
        validar_creacion_retencion(retenciones)


# ------------------------------------------------------------------
# RET-002: límite de cuatro butacas ocupantes por usuario y evento
# ------------------------------------------------------------------


def test_usuario_puede_tener_hasta_cuatro_butacas_ocupantes():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE),
        crear_hold("butaca-2", HoldStatus.ACTIVE),
        crear_hold("butaca-3", HoldStatus.ACTIVE),
        crear_hold("butaca-4", HoldStatus.ACTIVE),
    ]

    assert puede_crear_retencion_usuario(retenciones) is False


def test_usuario_no_puede_superar_cuatro_butacas_ocupantes():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE),
        crear_hold("butaca-2", HoldStatus.ACTIVE),
        crear_hold("butaca-3", HoldStatus.ACTIVE),
        crear_hold("butaca-4", HoldStatus.ACTIVE),
    ]

    with pytest.raises(LimiteButacasUsuarioError):
        validar_limite_butacas_usuario(retenciones)


def test_confirmadas_tambien_cuentan_como_butacas_ocupantes():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.CONFIRMED),
        crear_hold("butaca-2", HoldStatus.CONFIRMED),
        crear_hold("butaca-3", HoldStatus.CONFIRMED),
        crear_hold("butaca-4", HoldStatus.CONFIRMED),
    ]

    assert puede_crear_retencion_usuario(retenciones) is False


def test_expiradas_y_liberadas_no_cuentan_como_ocupantes():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.EXPIRED),
        crear_hold("butaca-2", HoldStatus.RELEASED),
        crear_hold("butaca-3", HoldStatus.ACTIVE),
    ]

    assert puede_crear_retencion_usuario(retenciones) is True


def test_usuario_con_tres_butacas_puede_ocupar_una_mas():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE),
        crear_hold("butaca-2", HoldStatus.ACTIVE),
        crear_hold("butaca-3", HoldStatus.CONFIRMED),
    ]

    assert puede_crear_retencion_usuario(retenciones) is True


def test_otro_usuario_no_se_ve_afectado_por_el_limite():
    retenciones = [
        crear_hold("butaca-1", HoldStatus.ACTIVE, user_id="usuario-1"),
        crear_hold("butaca-2", HoldStatus.ACTIVE, user_id="usuario-1"),
        crear_hold("butaca-3", HoldStatus.ACTIVE, user_id="usuario-1"),
        crear_hold("butaca-4", HoldStatus.ACTIVE, user_id="usuario-1"),
    ]

    retenciones_usuario_2 = [
        retencion
        for retencion in retenciones
        if retencion.user_id == "usuario-2"
    ]

    assert puede_crear_retencion_usuario(retenciones_usuario_2) is True