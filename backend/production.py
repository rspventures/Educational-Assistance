from waitress import serve
from app import app
import os

if __name__ == "__main__":
    # Production server configuration
    port = int(os.environ.get("PORT", 4000))
    serve(app, host="0.0.0.0", port=port, threads=4)
