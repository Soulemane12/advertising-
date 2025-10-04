#!/usr/bin/env python3

import subprocess
import sys
import os

def run_backend():
    """Run the FastAPI backend server"""

    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Not running in a virtual environment")
        print("💡 Recommended: Activate your virtual environment first")
        print("   source .venv/bin/activate  # or")
        print("   .venv\\Scripts\\activate     # on Windows")
        print()

    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    # Check if .env.local exists
    env_file = os.path.join("..", ".env.local")
    if os.path.exists(env_file):
        print("✅ Found .env.local file")
    else:
        print("❌ .env.local file not found")
        print("💡 Create .env.local in the root directory with your API keys")
        return

    print("🚀 Starting FastAPI backend server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API docs available at: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print()

    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        print("💡 Make sure you have installed the dependencies:")
        print("   pip install -r requirements.txt")

if __name__ == "__main__":
    run_backend()