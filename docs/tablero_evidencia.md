# Tablero de evidencia - RET-002

## Regla implementada

**RET-002 - Limite de butacas ocupantes por usuario y   evento**

Un usuario no puede tener mas de cuatro butacas ocupantes
en un mismo evento.

Se consideran ocupantes:

- `ACTIVE`
- `CONFIRMED`

No se consideran ocupantes:

- `EXPIRED`
- `RELEASED`

Cuando el usuario ya posee cuatro butacas ocupantes y solicita
una quinta, la API rechaza la operacion con HTTP `409 Conflict`.

---

## Decisiones de negocio

| Pregunta | Decision |
|---|---|
| Que estados cuentan como ocupados? | `ACTIVE` y `CONFIRMED` |
| Una retencion expirada cuenta? | No |
| Una retencion liberada cuenta? | No |
| Se permite llegar a cuatro? | Si |
| Se permite una quinta? | No |
| Que ocurre al liberar una butaca? | El usuario recupera capacidad |
| Que ocurre al confirmar? | Sigue contando como ocupada |
| El limite afecta a otros usuarios? | No |
| Que respuesta recibe el consumidor? | HTTP `409 Conflict` |
| `user_id` representa autenticacion real? | No, es un identificador simulado para el TP |

---

## Evidencia automatizada

### Suite normal de pytest

Comando:

```text
py -3.12 -m pytest