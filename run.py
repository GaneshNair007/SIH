"""
Rakshak (रक्षक) — Application Entrypoint
Run with: python run.py
"""
import sys
import uvicorn

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

if __name__ == "__main__":
    print("=================================================================")
    print("🛡️  Starting Rakshak (रक्षक) H2S Advisory Platform...")
    print("🌐  Web Interface: http://127.0.0.1:8000")
    print("🚀  1-Click Demo Login: http://127.0.0.1:8000/login")
    print("👔  Manager Control Room: http://127.0.0.1:8000/manager")
    print("📷  AI Optical Scanner: http://127.0.0.1:8000/manager/scan")
    print("📚  Swagger API Docs: http://127.0.0.1:8000/docs")
    print("=================================================================")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
