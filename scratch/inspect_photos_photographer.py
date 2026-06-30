import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
photographer_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

res = requests.get(url)
if res.status_code == 200:
    results = res.json().get("results", [])
    print("Total photos returned on page 1:", len(results))
    photographers = set()
    for p in results:
        # Check what fields are in a photo object
        p_name = p.get("photographer_name")
        p_id = p.get("photographer_id") or p.get("photographer") or p.get("owner", {}).get("id")
        photographers.add((p_name, p_id))
    print("Photographers in page 1:", list(photographers))
    # Print the keys of a photo object
    if results:
        print("Keys of photo:", list(results[0].keys()))
        print("Sample photo details:", {k: results[0][k] for k in ["id", "photographer_name", "photographer_id", "photographer"] if k in results[0]})
else:
    print("Error:", res.status_code)
