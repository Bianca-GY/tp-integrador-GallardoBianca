# Contrato de API para frontend

## Versión

**v2**

## Cambio de contrato — RET-002

Se incorpora la regla de negocio **RET-002**:

> Un usuario no puede tener más de cuatro butacas ocupantes en un mismo evento.

Para poder aplicar esta regla, el endpoint de creación de retenciones ahora
requiere identificar al usuario mediante `user_id`.

El starter no implementa autenticación real. `user_id` es una identificación
simulada del usuario para efectos del caso de uso y de las pruebas.

---

## Crear una retención

### Endpoint

```http
POST /events/{event_id}/holds