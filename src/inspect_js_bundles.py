import requests
import re

url = "https://ik.imagekit.io/yg7h35ptj/static/assets-js/9to29kiriu8mqtyvni02.js"
res = requests.get(url)
content = res.text

# Find occurrences of cart_id
print("Searching for references to cart_id:")
lines = content.split(";")
for i, line in enumerate(lines):
    if "cart_id" in line:
        # Print a snippet of the line around the match
        idx = line.find("cart_id")
        start = max(0, idx - 150)
        end = min(len(line), idx + 250)
        print(f"Snippet {i}: ... {line[start:end]} ...")
