import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
hugo_id = "84dd05e9-1797-4e12-9108-e16696762e3f"
felipe_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

res_all = requests.get(url)
res_hugo = requests.get(url, params={"photographer": hugo_id})
res_felipe = requests.get(url, params={"photographer": felipe_id})

print("All photos count:", res_all.json().get("count") if res_all.status_code == 200 else "Error")
print("Hugo photos count:", res_hugo.json().get("count") if res_hugo.status_code == 200 else "Error")
print("Felipe photos count:", res_felipe.json().get("count") if res_felipe.status_code == 200 else "Error")

# Try with photographer_id parameter too
res_hugo_id = requests.get(url, params={"photographer_id": hugo_id})
print("Hugo photo count with photographer_id parameter:", res_hugo_id.json().get("count") if res_hugo_id.status_code == 200 else "Error")
