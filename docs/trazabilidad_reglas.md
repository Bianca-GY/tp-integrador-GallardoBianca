# Trazabilidad de reglas

## RET-001

```text
RET-001
  ↓
Core: app/core/rules.py
  ↓
Caso de uso: app/application/use_cases.py
  ↓
Endpoint: POST /events/{event_id}/holds
  ↓
Tests: tests/test_rules.py
        tests/test_events.py
        tests/test_race_demo.py
  ↓
Estado: Implementada
  ↓
Limitación: garantía frente a concurrencia pendiente
RET-002
  ↓
Core: app/core/rules.py
  ↓
Caso de uso: app/application/use_cases.py
  ↓
Endpoint: POST /events/{event_id}/holds
  ↓
Entrada: user_id + seat_id
  ↓
Persistencia: app/infrastructure/repository.py
  ↓
Tests: tests/test_rules.py
        tests/test_events.py
  ↓
Estado: Implementada
  ↓
Limitación: garantía frente a concurrencia pendiente