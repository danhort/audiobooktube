import queue
import threading
from flask import Flask, request, Response, stream_with_context
import yt_dlp
import time
from flask_cors import CORS
from pathlib import Path
import subprocess
import shutil

app = Flask(__name__)
CORS(app)

client_queues = {}

@app.route('/stream/<client_id>')
def stream_progress(client_id):
    def event_stream():
        queue = client_queues[client_id]

        try:
            while True:
                # Block until a new progress message is received
                msg = queue.get()
                yield msg
        except GeneratorExit:
            # Clean up when the client closes the connection
            if client_id in client_queues:
                del client_queues[client_id]

    # Initialize queue for this client
    client_queues[client_id] = queue.Queue()
    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route('/download/<client_id>', methods=["POST"])
def start_downloads(client_id: str):
    links = [str(link) for link in request.form.getlist("links[]")]
    title = request.form.get("title", type=str)
    author = request.form.get("author", type=str)
    narrator = request.form.get("narrator", type=str)
    media_destination = request.form.get("mediaDestination", type=str)
    timestamp = int(time.time())
    temp_dir_path = Path(f"data/tmp/{timestamp}")

    if not links:
        return "Missing required field: links", 400
    if not title:
        return "Missing required field: title", 400
    if not author:
        return "Missing required field: author", 400
    if not narrator:
        return "Missing required field: narrator", 400
    if not media_destination:
        return "Missing required field: mediaDestination", 400

    destination_dir_path = Path(media_destination)
    destination_dir_path.mkdir(parents=True, exist_ok=True)

    def run_downloads():
        download_audio(links, title, client_id, temp_dir_path)
        metadata_file_name, file_list_file_name = process_download_files(title, author, narrator, client_id, temp_dir_path)

        concat_file_name=f"{temp_dir_path}/{title}.m4a"
        output_file_name=f"{destination_dir_path}/{title}.m4b"

        try:
            print(f"Combining files into {concat_file_name}...")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", file_list_file_name, "-c", "copy", concat_file_name], check=True)
            print(f"Adding metadata and chapters to create {output_file_name}...")
            subprocess.run(["ffmpeg", "-loglevel", "error", "-i", concat_file_name, "-i", metadata_file_name, "-map_metadata", "1", "-c", "copy", output_file_name, '-y'], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error during ffmpeg processing: {e}")
            if client_id in client_queues:
                client_queues[client_id].put(f"data: {{\"status\": \"error\", \"message\": \"{str(e)}\"}}\n\n")
            return

        # Clean up temporary files
        shutil.rmtree(temp_dir_path)

        # Send completion message
        if client_id in client_queues:
            client_queues[client_id].put("data: {\"percent\": 100, \"status\": \"complete\"}\n\n")

    # Start the download in a background thread so the SSE stream isn't blocked
    threading.Thread(target=run_downloads).start()
    return {"status": "started", "client_id": client_id}

def progress_hook(d, client_id: str):
    if d['status'] == 'downloading':
        total = d.get('total_bytes') or d.get('total_bytes_estimate')
        downloaded = d.get('downloaded_bytes', 0)
        percent = (downloaded / total * 100) if total else 0
        speed = d.get('speed', 'N/A')
        eta = d.get('eta', 'N/A')
        message = f"data: {{\"percent\": {percent:.2f}, \"speed\": \"{speed}\", \"eta\": \"{eta}\"}}\n\n"

        if client_id in client_queues:
            client_queues[client_id].put(message)
    else:
        # Send status updates for other events (e.g., finished, error)
        message = f"data: {{\"status\": \"{d['status']}\"}}\n\n"

        if client_id in client_queues:
            client_queues[client_id].put(message)

def generate_options(title: str, path: str, client_id: str):
    return {
        'format': 'bestaudio[ext=m4a]/bestaudio',
        'js_runtimes': {'node': {}},
        'impersonate_ip': 'chrome',
        'cookiesfrombrowser': ('chrome',),
        'split_chapters': True,
        'postprocessors': [{
            'key': 'FFmpegSplitChapters',
        }],
        'paths': {
            'home': path,
        },
        'outtmpl': {
            'default': f'{title}.%(ext)s',
            'chapter': f'chapters/%(section_number)s-%(section_start)s-%(section_end)s-%(section_title)s.%(ext)s'
        },
        'progress_hooks': [lambda d: progress_hook(d, client_id)],
    }

def download_audio(links: list[str], title: str, client_id: str, temp_dir_path: Path):
    try:
        part=1

        for link in links:
            yt_dlp.YoutubeDL(generate_options(title, f'{temp_dir_path}/part{part}', client_id)).download([link])
            part += 1
    except Exception as e:
        print(f"Error during download: {e}")
        if client_id in client_queues:
            client_queues[client_id].put(f"data: {{\"status\": \"error\", \"message\": \"{str(e)}\"}}\n\n")
        return

def process_download_files(title: str, author: str, narrator: str, client_id: str, temp_dir_path: Path):
    try:
        print(f"Processing files for {title}...")

        metadata_file_name = f"{temp_dir_path}/metadata.txt"
        file_list_file_name = f"{temp_dir_path}/filelist.txt"

        metadata_file = open(metadata_file_name, "w")
        file_list_file = open(file_list_file_name, "w")

        metadata_file.write(";FFMETADATA1\n")
        metadata_file.write(f"title={title}\n")
        metadata_file.write(f"artist={author}\n")
        metadata_file.write(f"narrator={narrator}\n\n")

        part_end_time=0
        chapter_end_time=0

        for part_dir in temp_dir_path.iterdir():
            if part_dir.is_dir() and part_dir.name.startswith("part"):
                print(f"Processing part directory: {part_dir}")

                for chapter_file in sorted((part_dir / "chapters").glob("*.m4a")):
                    print(f"Processing chapter file: {chapter_file}")

                    filename = chapter_file.stem
                    file_name_parts = filename.split("-")

                    if len(file_name_parts) < 4:
                        continue

                    chapter_start_time = float(file_name_parts[1]) + part_end_time
                    chapter_end_time = float(file_name_parts[2]) + part_end_time
                    chapter_title = file_name_parts[3]

                    metadata_file.write('[CHAPTER]\n')
                    metadata_file.write('TIMEBASE=1/1\n')
                    metadata_file.write(f"START={chapter_start_time}\n")
                    metadata_file.write(f"END={chapter_end_time}\n")
                    metadata_file.write(f"title={chapter_title}\n\n")
                    file_list_file.write(f"file '{part_dir.stem}/chapters/{chapter_file.stem.replace("'", r"'\''")}.m4a'\n")

                part_end_time = chapter_end_time

                # if chapter folder does not exist, add the part file directly to the filelist
                if not (part_dir / "chapters").exists():
                    part_file = part_dir / f"{title}.m4a"
                    if part_file.exists():
                        file_list_file.write(f"file '{part_dir.stem}/{part_file.stem}.m4a'\n")

        metadata_file.close()
        file_list_file.close()

        return metadata_file_name, file_list_file_name
    except Exception as e:
        print(f"Error during file processing: {e}")
        if client_id in client_queues:
            client_queues[client_id].put(f"data: {{\"status\": \"error\", \"message\": \"{str(e)}\"}}\n\n")
        return