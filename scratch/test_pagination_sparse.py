import requests

event_id = "b9d9f4ba-6271-4ad8-92f8-cd8e133ad8ce"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
felipe_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

for page in [1, 2, 10, 100, 1000, 9000]:
    res = requests.get(url, params={"photographer_id": felipe_id, "page": page})
    if res.status_code == 200:
        data = res.json()
        results = data.get("results", [])
        print(f"Page {page}: results={len(results)}, photographers={set(r.get('photographer_name') for r in results)}")
    else:
        print(f"Page {page}: error {res.status_code}")
