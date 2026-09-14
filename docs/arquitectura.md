# Arquitectura del proyecto

## Objetivo

Este proyecto utiliza una arquitectura en capas inspirada en Clean Architecture y arquitectura hexagonal, simplificada con fines didácticos.

El objetivo no es aplicar estrictamente todos los patrones asociados a esas arquitecturas, sino mantener un backend pequeño, comprensible, verificable y adecuado para trabajar con agentes de inteligencia artificial.

Las responsabilidades de cada capa forman parte del contrato del proyecto y deben respetarse durante toda su evolución.

---

## Estructura general

```text
app/
├── api/
├── application/
├── core/
└── infrastructure/
```

Cada área tiene una responsabilidad claramente definida.

---

## API

`app/api` es el adaptador de entrada HTTP.

### Responsabilidades

- Definir rutas y endpoints.
- Validar requests.
- Recibir parámetros y cuerpos HTTP.
- Transformar resultados en respuestas HTTP.
- Traducir errores conocidos a códigos HTTP.
- Exponer los contratos mediante OpenAPI.

### No debe

- Contener reglas de negocio.
- Ejecutar consultas SQL.
- Acceder directamente a PostgreSQL.
- Decidir estados o transiciones del dominio.
- Contener lógica profunda del caso de uso.

---

## Application

`app/application` contiene los casos de uso de la aplicación.

### Responsabilidades

- Coordinar los pasos necesarios para ejecutar una operación.
- Solicitar información a la infraestructura.
- Invocar reglas y decisiones del core cuando corresponda.
- Ordenar la creación, modificación o persistencia de datos.
- Organizar el flujo entre entrada, dominio y persistencia.

Application conoce **qué pasos ejecutar y en qué orden**, pero no debería definir reglas de negocio permanentes.

### No debe

- Conocer detalles HTTP.
- Devolver códigos HTTP.
- Ejecutar SQL directamente.
- Depender de FastAPI.
- Contener detalles propios de PostgreSQL o SQLAlchemy.

---

## Core

`app/core` contiene el conocimiento estable del negocio.

Aquí pueden vivir:

- entidades;
- estados;
- transiciones válidas;
- invariantes;
- reglas de negocio;
- decisiones que deberían seguir siendo válidas aunque cambien FastAPI, PostgreSQL o SQLAlchemy.

### No debe depender de

- FastAPI;
- SQLAlchemy;
- PostgreSQL;
- psycopg;
- módulos de infraestructura;
- detalles HTTP.

El core decide **qué está permitido** en el negocio.

No todas las operaciones deben pasar obligatoriamente por el core. Las consultas simples pueden no requerir decisiones de dominio.

Toda decisión importante del negocio sí debe estar expresada en el core o apoyarse en conceptos definidos allí.

---

## Infrastructure

`app/infrastructure` contiene los detalles técnicos y los adaptadores de salida.

### Responsabilidades

- Acceso a PostgreSQL.
- Configuración de SQLAlchemy.
- Modelos de persistencia.
- Sesiones y transacciones.
- Consultas a la base de datos.
- Repositorios.
- Migraciones de Alembic.
- Integración con servicios externos.

La infraestructura no define reglas de negocio.

Puede aportar garantías técnicas necesarias para cumplirlas (restricciones, transacciones, bloqueos, etc.), pero la regla debe existir independientemente de la tecnología utilizada.

---

## Dirección de las dependencias

Las dependencias conceptuales apuntan hacia el interior.

```text
API
  ↓
Application
  ↓
Core
```

Infrastructure es utilizada por Application para consultar y persistir datos.

### Reglas

- Core no importa módulos de API, Application ni Infrastructure.
- API no accede directamente a Infrastructure cuando existe un caso de uso correspondiente en Application.

---

## Flujo de una consulta simple

Una consulta que no requiere decisiones de negocio puede seguir el siguiente recorrido:

```text
HTTP Request
      ↓
     API
      ↓
Application
      ↓
Infrastructure
      ↓
Application
      ↓
     API
      ↓
HTTP Response
```

Ejemplo:

```text
GET /events
```

Listar eventos puede no requerir participación del core si solamente recupera información.

---

## Flujo de una operación con reglas de negocio

Una operación que sí requiere decisiones del dominio puede seguir el siguiente recorrido:

```text
HTTP Request
      ↓
     API
      ↓
Application
      ↓
Infrastructure
      ↓
Application
      ↓
    Core
      ↓
Application
      ↓
Infrastructure
      ↓
Application
      ↓
     API
      ↓
HTTP Response
```

Ejemplo para crear una retención:

1. API recibe y valida la solicitud.
2. Application coordina el caso de uso.
3. Infrastructure recupera evento, butaca y retenciones existentes.
4. Core evalúa estados y reglas del negocio.
5. Application decide continuar con la operación.
6. Infrastructure persiste la nueva retención.
7. API devuelve la respuesta HTTP correspondiente.
### Flujo específico de RET-002

Para aplicar el límite de cuatro butacas ocupantes por usuario y evento, el
flujo agrega la consulta de las retenciones ocupantes del usuario antes de
crear la nueva retención.

```text
HTTP Request
      ↓
     API
      ↓
 Application
      ↓
Infrastructure
      ↓
Consultar retenciones ocupantes
del usuario + evento
      ↓
 Application
      ↓
    Core
      ↓
Evaluar RET-001 + RET-002
      ↓
 ¿Permitido?
   ↙       ↘
 NO         SÍ
 ↓           ↓
HTTP 409   Infrastructure
           ↓
       Crear retención
           ↓
          API
           ↓
      HTTP Response
---

## Reglas y garantías técnicas

Una regla de negocio puede requerir una garantía técnica para cumplirse correctamente.

Ejemplo:

```text
RET-001

Una butaca no puede tener dos retenciones activas para el mismo evento.
```

Distribución de responsabilidades:

- Core expresa la regla y los estados involucrados.
- Application coordina el caso de uso.
- Infrastructure consulta y persiste.
- PostgreSQL puede aportar la garantía final frente a concurrencia.
- API traduce el resultado a una respuesta HTTP.

La regla pertenece al negocio, aunque su cumplimiento bajo concurrencia pueda requerir mecanismos propios de la infraestructura.

---

## Principios del proyecto

- Sin capas ceremoniales innecesarias.
- Sin abstracciones que solo reenvíen llamadas.
- Sin interfaces, fábricas o patrones complejos sin una necesidad concreta.
- Cada módulo debe tener una responsabilidad identificable.
- Los cambios deben ser pequeños y verificables.
- La arquitectura debe crecer de forma incremental.
- La suite normal de pruebas debe permanecer en verde.
- Las decisiones importantes deben quedar documentadas.
- Las reglas deben mantenerse coherentes con código, diagramas, contratos y pruebas.
- La API debe poder levantarse mediante Docker Compose de forma simple.
- La API debe quedar preparada para ser consumida por clientes externos, aunque este repositorio no incluya un frontend.

---

## Desarrollo asistido por inteligencia artificial

La arquitectura no organiza únicamente el código.

También proporciona un contexto estable para que los agentes de inteligencia artificial puedan:

- comprender el sistema;
- respetar los límites entre capas;
- proponer cambios consistentes;
- mantener reglas existentes;
- evitar responsabilidades incorrectas;
- generar cambios auditables.

Por ese motivo, los siguientes artefactos forman parte de la arquitectura del proyecto:

- `AGENTS.md`
- `docs/alcance_starter.md`
- `docs/reglas.md`
- `docs/trazabilidad_reglas.md`
- diagramas
- ADR
- contrato OpenAPI
- pruebas automatizadas

Estos elementos no constituyen documentación pasiva. Son parte del contexto utilizado durante el desarrollo y deben mantenerse sincronizados con la implementación.

---

## Estado inicial del starter

El estado inicial del repositorio incluye:

- Endpoint `GET /health`.
- Endpoint `GET /events` con datos de ejemplo.
- Organización en API, Application, Core e Infrastructure.
- Configuración mínima de PostgreSQL.
- SQLAlchemy.
- Alembic.
- Docker Compose.
- pytest.

Este estado representa únicamente el punto de partida.

El alcance funcional completo del starter se encuentra definido en:

```text
docs/alcance_starter.md
```