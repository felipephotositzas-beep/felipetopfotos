import requests

url = "https://painel.topfotos.com.br/api/pages/events/list"
felipe_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

res = requests.get(url, params={"photographer": felipe_id})
if res.status_code == 200:
    results = res.json().get("results", [])
    print("Checking events returned by photographer filter...")
    for event in results:
        owner_id = event.get('owner', {}).get('id')
        if owner_id == felipe_id:
            eid = event.get('id')
            name = event.get('name')
            p_res = requests.get(f"https://painel.topfotos.com.br/api/photo/list/{eid}")
            count = p_res.json().get("count", 0) if p_res.status_code == 200 else "Error"
            print(f"  Owned by Felipe: ID {eid} ({name}) has {count} photos")
else:
    print("Error:", res.status_code)
