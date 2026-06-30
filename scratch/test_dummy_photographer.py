import requests

event_id = "b9d9f4ba-6271-4ad8-92f8-cd8e133ad8ce"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
dummy_id = "00000000-0000-0000-0000-000000000000"

res = requests.get(url, params={"photographer_id": dummy_id, "page": 1})
if res.status_code == 200:
    data = res.json()
    print("Dummy count:", data.get("count"))
    results = data.get("results", [])
    print("Photographers returned on page 1 with dummy filter:", set(r.get("photographer_name") for r in results))
else:
    print("Error:", res.status_code)
