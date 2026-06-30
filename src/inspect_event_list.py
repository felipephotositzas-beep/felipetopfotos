import requests
import json

response = requests.get("https://painel.topfotos.com.br/api/pages/events/list")
if response.status_code == 200:
    data = response.json()
    results = data.get("results", [])
    if len(results) > 0:
        print("Keys of first event in list:", list(results[0].keys()))
        # Print first event
        print(json.dumps(results[0], indent=2, ensure_ascii=False))
else:
    print(response.text)
