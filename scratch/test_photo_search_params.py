import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"

params_to_test = [
    {"search": "Felipephotositz"},
    {"search": "4b59febb-2dd3-4002-987f-ad8da0840dbd"},
    {"q": "Felipephotositz"},
    {"photographer": "Felipephotositz"},
    {"photographer_name": "Felipephotositz"},
]

for p in params_to_test:
    res = requests.get(url, params=p)
    if res.status_code == 200:
        data = res.json()
        print(f"Params {p}: count={data.get('count')}, num_results={len(data.get('results', []))}")
    else:
        print(f"Params {p}: error {res.status_code}")
