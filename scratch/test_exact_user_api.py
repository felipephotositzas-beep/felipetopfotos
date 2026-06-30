import requests

url = "https://painel.topfotos.com.br/api/photo/list/b9d9f4ba-6271-4ad8-92f8-cd8e133ad8ce"
params = {
    "page": 2,
    "media_type": "photo",
    "photographer_id": "4b59febb-2dd3-4002-987f-ad8da0840dbd"
}

res = requests.get(url, params=params)
if res.status_code == 200:
    data = res.json()
    print("Status 200 OK")
    print("count:", data.get("count"))
    print("num_pages:", data.get("num_pages"))
    results = data.get("results", [])
    print("Results length on page 2:", len(results))
    if results:
        print("Photographers in page 2:", set(r.get("photographer_name") for r in results))
        print("Photographer IDs in page 2:", set(r.get("photographer") for r in results))
else:
    print("Error:", res.status_code)
