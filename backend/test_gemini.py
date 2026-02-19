
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

candidates = [
    "gemini-1.5-flash-002",
    "gemini-1.5-pro-002",
    "gemini-2.0-flash-exp"
]

print(f"Testing with API Key: {api_key[:5]}...{api_key[-5:]}")

for model in candidates:
    print(f"\n--- Testing {model} ---")
    try:
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.3,
            max_retries=1  # Don't wait too long
        )
        resp = llm.invoke("Hello")
        print(f"SUCCESS with {model}: {resp.content}")
        break
    except Exception as e:
        print(f"FAILED {model}: {str(e)[:200]}...")
