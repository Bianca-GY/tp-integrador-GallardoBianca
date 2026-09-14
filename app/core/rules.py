"""
Reglas de negocio del dominio.

Estas reglas no dependen de FastAPI, SQLAlchemy ni de la base de datos.
"""


from app.core.entities import Hold, HoldStatus


class RetencionDuplicadaError(Exception):
    """La butaca ya tiene una retención activa."""


class LimiteButacasUsuarioError(Exception):
    """El usuario alcanzó el máximo de butacas ocupantes para un evento."""


def puede_crear_retencion(
    retenciones_existentes: list[Hold],
) -> bool:
    """
    RET-001: una butaca no puede tener dos retenciones activas
    para el mismo evento.
    """
    activas = [
        retencion
        for retencion in retenciones_existentes
        if retencion.status == HoldStatus.ACTIVE
    ]

    return len(activas) == 0


def validar_creacion_retencion(
    retenciones_existentes: list[Hold],
) -> None:
    """
    Valida RET-001.
    """
    if not puede_crear_retencion(retenciones_existentes):
        raise RetencionDuplicadaError(
            "La butaca ya tiene una retención activa (RET-001)."
        )


def puede_crear_retencion_usuario(
    retenciones_usuario: list[Hold],
    limite: int = 4,
) -> bool:
    """
    RET-002: un usuario no puede tener más de cuatro butacas
    ocupantes en un mismo evento.

    ACTIVE y CONFIRMED cuentan como butacas ocupantes.
    EXPIRED y RELEASED no cuentan.
    """
    ocupantes = [
        retencion
        for retencion in retenciones_usuario
        if retencion.status in (
            HoldStatus.ACTIVE,
            HoldStatus.CONFIRMED,
        )
    ]

    return len(ocupantes) < limite


def validar_limite_butacas_usuario(
    retenciones_usuario: list[Hold],
    limite: int = 4,
) -> None:
    """
    Valida RET-002: el usuario todavía tiene capacidad
    para ocupar otra butaca en el evento.
    """
    if not puede_crear_retencion_usuario(
        retenciones_usuario,
        limite,
    ):
        raise LimiteButacasUsuarioError(
            "El usuario no puede tener más de cuatro butacas "
            "ocupantes en el mismo evento (RET-002)."
        )