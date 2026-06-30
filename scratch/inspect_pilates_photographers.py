import requests

event_id = "56d0cae3-5bd7-4cf6-8855-d940c3096342" # Pilates aula beira rio
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"

res = requests.get(url)
if res.status_code == 200:
    results = res.json().get("results", [])
    print("Total photos on page 1 of Pilates:", len(results))
    photographers = set()
    for p in results:
        photographers.add((p.get("photographer_name"), p.get("photographer")))
    print("Photographers on page 1 of Pilates:", list(photographers))
else:
    print("Error:", res.status_code)
