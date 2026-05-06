from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def root():
    return jsonify({
        'message': 'Kenya House Listings API',
        'status': 'running',
        'database': 'None'
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Kenya House Listings API',
        'version': '1.0.0'
    })

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
