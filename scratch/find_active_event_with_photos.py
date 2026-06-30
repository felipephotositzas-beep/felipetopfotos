import requests

url = "https://painel.topfotos.com.br/api/pages/events/list"
photographer_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

res = requests.get(url, params={"photographer": photographer_id})
if res.status_code == 200:
    results = res.json().get("results", [])
    for event in results:
        eid = event.get('id')
        name = event.get('name')
        # check photo count
        p_res = requests.get(f"https://painel.topfotos.com.br/api/photo/list/{eid}")
        if p_res.status_code == 200:
            count = p_res.json().get("count", 0)
            if count > 0:
                print(f"Event ID {eid} ({name}) has {count} photos. Checking filtering...")
                # Test photographer param
                p_res_filter = requests.get(f"https://painel.topfotos.com.br/api/photo/list/{eid}", params={"photographer": photographer_id})
                filter_count = p_res_filter.json().get("count", 0) if p_res_filter.status_code == 200 else "Error"
                print(f"  Filtered by photographer={photographer_id}: count={filter_count}")
                break
else:
    print("Error:", res.status_code)
