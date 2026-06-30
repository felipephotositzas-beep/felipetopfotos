import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
werlly_id = "5a822a1b-a712-484a-86c3-c6c7273558d9"

res = requests.get(url, params={"photographer_id": werlly_id})
if res.status_code == 200:
    data = res.json()
    print("Werlly count:", data.get("count"))
    results = data.get("results", [])
    print("Photographers returned:", set(r.get("photographer_name") for r in results))
else:
    print("Error:", res.status_code)
