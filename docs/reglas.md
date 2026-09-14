# Reglas de negocio

## RET-001 — Una butaca no puede tener dos retenciones activas

Una butaca no puede tener dos retenciones activas para el mismo evento.

La regla se evalúa antes de crear una nueva retención.

Estados considerados:

- `ACTIVE`: la butaca está ocupada por una retención activa.
- `CONFIRMED`: la retención fue confirmada.
- `EXPIRED`: la retención expiró.
- `RELEASED`: la retención fue liberada.

La implementación actual de RET-001 considera específicamente las retenciones
`ACTIVE` para impedir una nueva retención.

**Estado:** Implementada a nivel de dominio. La garantía frente a solicitudes
concurrentes sigue pendiente, según el alcance del starter y ADR-001.

---

## RET-002 — Un usuario no puede tener más de cuatro butacas ocupantes en un mismo evento

Un usuario no puede tener más de **cuatro butacas ocupantes** en un mismo evento.

La regla se evalúa antes de crear una nueva retención.

### ¿Qué se considera una butaca ocupante?

Para RET-002 cuentan como ocupantes:

- `ACTIVE`: la retención está activa.
- `CONFIRMED`: la retención fue confirmada.

No cuentan como ocupantes:

- `EXPIRED`: la retención expiró.
- `RELEASED`: la retención fue liberada.

Por lo tanto, cuando un usuario ya tiene cuatro butacas en estado
`ACTIVE` y/o `CONFIRMED` dentro del mismo evento, una nueva solicitud de
retención debe ser rechazada.

### Comportamiento esperado

- Con 0, 1, 2 o 3 butacas ocupantes, el usuario puede solicitar otra butaca.
- Con 4 butacas ocupantes, la siguiente solicitud es rechazada.
- La solicitud rechazada no crea una nueva retención.
- Si una retención pasa a `EXPIRED` o `RELEASED`, esa butaca deja de contar
  para el límite y el usuario recupera capacidad.
- Una retención `CONFIRMED` continúa contando como butaca ocupante.
- El límite se aplica por combinación **usuario + evento**.
- Otro usuario no se ve afectado por las butacas ocupadas por un usuario
  diferente.

### Identificación del usuario

El starter no incluye autenticación real. Para poder expresar y verificar
RET-002, la solicitud de creación de una retención recibe un `user_id`.

Este `user_id` representa al usuario a efectos de la regla y no constituye
un mecanismo de autenticación o autorización.

### Error esperado

Cuando se intenta superar el límite, la API rechaza la solicitud con
HTTP `409 Conflict` e informa que el usuario no puede tener más de cuatro
butacas ocupantes en el mismo evento.

**Estado:** Implementada a nivel de dominio y caso de uso.

**Limitación de concurrencia:** la comprobación de RET-002 actualmente se
realiza mediante una lectura, validación y posterior inserción. No existe
todavía un mecanismo de bloqueo o una operación atómica que garantice esta
regla frente a solicitudes concurrentes. Esta limitación es intencional en
el alcance actual del starter y debe quedar explicitada en la evidencia.