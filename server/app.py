import queue
import threading
from flask import Flask, request, Response, stream_with_context
import yt_dlp
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global dictionary to hold message queues for multiple clients
# (Use Redis/Celery for production scaling)
client_queues = {}

def progress_hook(d, client_id):
    """Hook to capture yt-dlp progress and place it in the queue."""
    if d['status'] == 'downloading':
        total = d.get('total_bytes') or d.get('total_bytes_estimate')
        downloaded = d.get('downloaded_bytes', 0)

        # Calculate percentage
        percent = (downloaded / total * 100) if total else 0
        speed = d.get('speed', 'N/A')
        eta = d.get('eta', 'N/A')

        message = f"data: {{\"percent\": {percent:.2f}, \"speed\": \"{speed}\", \"eta\": \"{eta}\"}}\n\n"

        # Put in the specific client's queue
        if client_id in client_queues:
            client_queues[client_id].put(message)

@app.route('/stream/<client_id>')
def stream_progress(client_id):
    """Server-Sent Events endpoint for the frontend."""
    def event_stream():
        q = client_queues[client_id]
        try:
            while True:
                # Block until a new progress message is received
                msg = q.get()
                yield msg
        except GeneratorExit:
            # Clean up when the client closes the connection
            if client_id in client_queues:
                del client_queues[client_id]

    # Initialize queue for this client
    client_queues[client_id] = queue.Queue()
    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route('/download/<client_id>', methods=["POST"])
def start_downloads(client_id):
    links = request.form.getlist("links[]")
    title = request.form.get("title")
    author = request.form.get("author")
    narrator = request.form.get("narrator")
    mediaDestination = request.form.get("mediaDestination")
    timestamp = int(time.time())

    if not links:
        return "Missing required field: links", 400
    if not title:
        return "Missing required field: title", 400
    if not author:
        return "Missing required field: author", 400
    if not narrator:
        return "Missing required field: narrator", 400
    if not mediaDestination:
        return "Missing required field: mediaDestination", 400

    """Triggers the yt-dlp download in a background thread."""
    def run_downloads():
        part=1

        for link in links:
            ydl_opts = {
                'format': 'bestaudio/best',
                'merge_output_format': 'mp4',
                'split_chapters': True,
                'js_runtimes': {'node': {}},
                'paths': {
                    'home': f'data/tmp/{timestamp}',
                },
                'outtmpl': {
                    'default': f'part{part}/{title}.%(ext)s',
                    'chapter': f'chapter:part{part}/chapters/%(section_number)s-%(section_start)s-%(section_end)s-%(section_title)s.%(ext)s'
                },
                'progress_hooks': [lambda d: progress_hook(d, client_id)],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([link])

            part += 1

        # Process the downloaded files (e.g., move to mediaDestination, add metadata, etc.)

        # Send completion message
        if client_id in client_queues:
            client_queues[client_id].put("data: {\"percent\": 100, \"status\": \"complete\"}\n\n")

    # Start the download in a background thread so the SSE stream isn't blocked
    threading.Thread(target=run_downloads).start()
    return {"status": "started", "client_id": client_id}
