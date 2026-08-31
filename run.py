"""
Rakshak (रक्षक) — Application Entrypoint
Run with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    print("=================================================================")
    print("🛡️  Starting Rakshak (रक्षक) H2S Advisory Platform...")
    print("🌐  Web Interface: http://127.0.0.1:8000")
    print("📚  Swagger API Docs: http://127.0.0.1:8000/docs")
    print("=================================================================")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
