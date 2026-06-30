import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
felipe_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

params_to_test = [
    {"photographer": felipe_id},
    {"photographer_id": felipe_id},
    {"photographer__id": felipe_id},
    {"photographer__uuid": felipe_id},
    {"photographer_name": "Felipephotositz"},
    {"photographer__name": "Felipephotositz"},
    {"owner": felipe_id},
    {"user": felipe_id},
]

for p in params_to_test:
    res = requests.get(url, params=p)
    if res.status_code == 200:
        print(f"Params {p}: count={res.json().get('count')}")
    else:
        print(f"Params {p}: error {res.status_code}")
