"""
Unified Local Development Server Runner
Starts both the FastAPI backend (port 8000) and the Vite React frontend (port 5173).
"""
import os
import sys
import time
import subprocess
import signal

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "mobile-pwa")


def main():
    print("=" * 60)
    print("Launching SignalSafe Campus - Backend & Frontend")
    print("=" * 60)

    # Detect npm binary on Windows
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR
    )

    print("[2/2] Starting Vite Frontend on http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR
    )

    print("\n" + "=" * 60)
    print("Both servers are up and running!")
    print("  * Frontend UI:     http://localhost:5173")
    print("  * Backend API:     http://127.0.0.1:8000")
    print("  * Swagger Docs:    http://127.0.0.1:8000/docs")
    print("  * Health Check:    http://127.0.0.1:8000/api/v1/health")
    print("=" * 60 + "\n")

    def signal_handler(sig, frame):
        print("\nStopping servers...")
        try:
            frontend_proc.terminate()
        except Exception:
            pass
        try:
            backend_proc.terminate()
        except Exception:
            pass
        print("Servers stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while True:
            b_ret = backend_proc.poll()
            f_ret = frontend_proc.poll()
            if b_ret is not None:
                print(f"[Notice] Backend stopped with code {b_ret}")
                break
            if f_ret is not None:
                print(f"[Notice] Frontend stopped with code {f_ret}")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        signal_handler(None, None)


if __name__ == "__main__":
    main()
