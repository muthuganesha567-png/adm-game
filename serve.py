#!/usr/bin/env python3
"""Minimal static file server for Dharma Decision (no dependencies).
Usage: python serve.py [port]   -> http://localhost:8000
"""
import http.server, socketserver, sys, os, mimetypes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, fmt, *args):
        if '404' in str(args): super().log_message(fmt, *args)

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with Server(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Dharma Decision running at http://localhost:{PORT}  (Ctrl+C to stop)')
        try: httpd.serve_forever()
        except KeyboardInterrupt: pass
