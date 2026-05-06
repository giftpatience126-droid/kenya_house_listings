import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel serverless handler
def handler(request):
    return app(request.environ, lambda status, headers: lambda: None)

# Export for Vercel
app_handler = handler
