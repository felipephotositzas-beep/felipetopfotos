import requests

event_id = "a6f97ad4-5a58-4d4f-bb88-479cdc22d8f0"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"
felipe_id = "4b59febb-2dd3-4002-987f-ad8da0840dbd"

page = 1
felipe_total = 0
while True:
    res = requests.get(url, params={"page": page})
    if res.status_code != 200:
        break
    data = res.json()
    results = data.get("results", [])
    if not results:
        break
    # count felipe photos in this page
    f_count = sum(1 for p in results if p.get("photographer") == felipe_id)
    felipe_total += f_count
    print(f"Page {page}: found {f_count} photos for Felipe out of {len(results)}")
    
    if page >= 5: # limit to 5 pages for quick test
        print("Stopping at page 5...")
        break
    page += 1

print("Total Felipe photos found in first 5 pages:", felipe_total)
