# Especificación del starter

## Objetivo

El starter debe permitir estudiar arquitectura, trazabilidad y una condición
de carrera antes de resolverla.

## Endpoints mínimos

- GET /events
- GET /events/{event_id}
- GET /events/{event_id}/seats
- POST /events/{event_id}/holds
- POST /holds/{hold_id}/confirm

## Regla principal

RET-001: una butaca no puede tener dos retenciones activas para el mismo evento.

## Estado inicial

En la Semana 1, RET-001 está expresada pero no garantizada ante concurrencia.

La implementación inicial realiza:

1. consulta de disponibilidad;
2. demora didáctica configurable;
3. inserción de la retención.

No debe existir todavía:

- restricción única;
- bloqueo explícito;
- operación atómica;
- manejo de conflicto de base de datos.

## Pruebas

La suite normal debe quedar en verde.

La prueba marcada `race_demo` se ejecuta separadamente y demuestra el defecto
de concurrencia pendiente.

## Alcance excluido

- frontend;
- autenticación real;
- pagos;
- Redis;
- WebSockets;
- microservicios.