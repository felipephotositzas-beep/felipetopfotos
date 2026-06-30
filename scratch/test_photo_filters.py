import requests

event_id = "21b1705d-2a5b-4ca0-901e-8fd3446cae96"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
photographer_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

# Test standard list
res = requests.get(url)
print("Standard photos count:", res.json().get("count") if res.status_code == 200 else res.status_code)
if res.status_code == 200:
    results = res.json().get("results", [])
    print(f"Sample photographer name of standard list: {[r.get('photographer_name') for r in results[:3]]}")

# Test different filter params
for param in ["photographer", "owner", "photographer_id", "owner_id", "user", "user_id"]:
    res = requests.get(url, params={param: photographer_id})
    if res.status_code == 200:
        data = res.json()
        count = data.get("count")
        results = data.get("results", [])
        print(f"Param '{param}': count={count}, sample photographers={[r.get('photographer_name') for r in results[:2]]}")
    else:
        print(f"Param '{param}': error {res.status_code}")
