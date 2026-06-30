import requests

event_id = "b9d9f4ba-6271-4ad8-92f8-cd8e133ad8ce"
url = f"https://painel.topfotos.com.br/api/photo/list/{event_id}"

res_all = requests.get(url, params={"photographer_id": "4b59febb-2dd3-4002-987f-ad8da0840dbd"})
res_photo = requests.get(url, params={"photographer_id": "4b59febb-2dd3-4002-987f-ad8da0840dbd", "media_type": "photo"})
res_video = requests.get(url, params={"photographer_id": "4b59febb-2dd3-4002-987f-ad8da0840dbd", "media_type": "video"})

print("All media count:", len(res_all.json().get("results", [])))
print("Photo media count:", len(res_photo.json().get("results", [])))
print("Video media count:", len(res_video.json().get("results", [])))
