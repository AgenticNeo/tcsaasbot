#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error

def ask_ollama(prompt, model="gpt-oss:120b-cloud"):
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('response', '')
            
    except urllib.error.URLError as e:
        return f"Error connecting to Ollama: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ask_ollama.py <prompt>")
        sys.exit(1)
        
    prompt = sys.argv[1]
    response = ask_ollama(prompt)
    print(response)
