import requests
import json

try:
    response = requests.get("http://localhost:11434/api/tags", timeout=5)
    if response.status_code == 200:
        models = response.json()
        print(json.dumps(models, indent=2))
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Failed to connect to Ollama: {e}")
