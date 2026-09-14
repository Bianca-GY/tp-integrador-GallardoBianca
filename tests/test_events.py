from fastapi.testclient import TestClient


def test_listar_eventos(client: TestClient):
    response = client.get("/events")

    assert response.status_code == 200

    eventos = response.json()

    assert len(eventos) >= 1
    assert eventos[0]["id"] == "evento-demo"


def test_obtener_evento(client: TestClient):
    response = client.get("/events/evento-demo")

    assert response.status_code == 200

    evento = response.json()

    assert evento["id"] == "evento-demo"
    assert evento["name"] == "Recital de ejemplo"


def test_obtener_evento_inexistente(client: TestClient):
    response = client.get("/events/no-existe")

    assert response.status_code == 404


def test_listar_butacas(client: TestClient):
    response = client.get("/events/evento-demo/seats")

    assert response.status_code == 200

    butacas = response.json()

    assert len(butacas) == 5
    assert butacas[0]["event_id"] == "evento-demo"


def test_listar_butacas_evento_inexistente(client: TestClient):
    response = client.get("/events/no-existe/seats")

    assert response.status_code == 404


def test_crear_retencion_exitosa(client: TestClient):
    response = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-1",
            "user_id": "usuario-1",
        },
    )

    assert response.status_code == 201

    hold = response.json()

    assert hold["event_id"] == "evento-demo"
    assert hold["seat_id"] == "butaca-1"
    assert hold["status"] == "active"


def test_crear_retencion_duplicada(client: TestClient):
    primera = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-2",
            "user_id": "usuario-1",
        },
    )

    assert primera.status_code == 201

    segunda = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-2",
            "user_id": "usuario-1",
        },
    )

    assert segunda.status_code == 409


def test_crear_retencion_butaca_inexistente(client: TestClient):
    response = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "no-existe",
            "user_id": "usuario-1",
        },
    )

    assert response.status_code == 404


def test_crear_retencion_evento_inexistente(client: TestClient):
    response = client.post(
        "/events/no-existe/holds",
        json={
            "seat_id": "butaca-1",
            "user_id": "usuario-1",
        },
    )

    assert response.status_code == 404


def test_confirmar_retencion(client: TestClient):
    crear = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-3",
            "user_id": "usuario-1",
        },
    )

    assert crear.status_code == 201

    hold_id = crear.json()["id"]

    confirmar = client.post(
        f"/holds/{hold_id}/confirm",
    )

    assert confirmar.status_code == 200
    assert confirmar.json()["status"] == "confirmed"


def test_confirmar_retencion_inexistente(client: TestClient):
    response = client.post(
        "/holds/no-existe/confirm",
    )

    assert response.status_code == 404


# ------------------------------------------------------------------
# RET-002: límite de cuatro butacas ocupantes por usuario y evento
# ------------------------------------------------------------------


def test_usuario_no_puede_ocupar_una_quinta_butaca(client: TestClient):
    user_id = "usuario-limite"

    for seat_id in [
        "butaca-1",
        "butaca-2",
        "butaca-3",
        "butaca-4",
    ]:
        response = client.post(
            "/events/evento-demo/holds",
            json={
                "seat_id": seat_id,
                "user_id": user_id,
            },
        )

        assert response.status_code == 201

    quinta = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-5",
            "user_id": user_id,
        },
    )

    assert quinta.status_code == 409
    assert "RET-002" in quinta.json()["detail"]


def test_el_limite_de_un_usuario_no_afecta_a_otro(client: TestClient):
    user_id_1 = "usuario-limite"
    user_id_2 = "usuario-otro"

    for seat_id in [
        "butaca-1",
        "butaca-2",
        "butaca-3",
        "butaca-4",
    ]:
        response = client.post(
            "/events/evento-demo/holds",
            json={
                "seat_id": seat_id,
                "user_id": user_id_1,
            },
        )

        assert response.status_code == 201

    response_otro_usuario = client.post(
        "/events/evento-demo/holds",
        json={
            "seat_id": "butaca-5",
            "user_id": user_id_2,
        },
    )

    assert response_otro_usuario.status_code == 201