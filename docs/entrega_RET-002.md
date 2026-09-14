# Entrega RET-002 — Límite de butacas ocupantes por usuario

## 1. Regla implementada

Se implementó la regla **RET-002**:

> Un usuario no puede tener más de cuatro butacas ocupantes en un mismo
> evento.

El límite se aplica por la combinación **usuario + evento**.

Se consideran ocupantes las retenciones en estado `ACTIVE` y `CONFIRMED`.
Las retenciones `EXPIRED` y `RELEASED` no cuentan para el límite.

Cuando un usuario ya posee cuatro butacas ocupantes e intenta ocupar una
quinta, la solicitud es rechazada con **HTTP 409 Conflict** y se informa
RET-002.

## 2. Cambios realizados

La regla se implementó en el dominio:

```text
app/core/rules.py