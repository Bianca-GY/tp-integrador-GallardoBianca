from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_serializer


def convertir_a_utc(value: datetime) -> datetime:
    """
    Garantiza que las fechas expuestas por la API tengan zona horaria UTC.

    SQLite puede devolver datetime sin tzinfo aunque el valor original
    haya sido creado como UTC.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    starts_at: datetime
    ends_at: datetime

    @field_serializer("starts_at", "ends_at")
    def serializar_fecha(self, value: datetime) -> datetime:
        return convertir_a_utc(value)


class SeatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    label: str


class HoldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    seat_id: str
    status: str
    created_at: datetime

    @field_serializer("created_at")
    def serializar_fecha(self, value: datetime) -> datetime:
        return convertir_a_utc(value)


class CreateHoldIn(BaseModel):
    seat_id: str
    user_id: str