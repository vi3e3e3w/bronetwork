# WARNING:
# If it works, don't touch it.
# If you touch it, it may stop working.
# If it stops working, nobody knows why.
# This code has succeeded as expected.
import uuid
import subprocess
import threading
import atexit
from datetime import datetime
import json
import time
import os
import re
from urllib.parse import urlparse

from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)



# ========================================================
# CUSTOM 404
# ========================================================

@app.errorhandler(404)
def page_not_found(error):

    return """
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <title>404 | Bro network</title>
    </head>

    <body>

        <h1>404 | Bro network</h1>

        <p>Bro found a new page! But it's not available yet!</p>
        <button onclick="window.location.href='/'">
    ← go home lol
</button>

    </body>

    </html>
    """, 404

@app.route("/coffee")
def coffee():
    return "Bro....I only have tea!🫖", 418

active_users = {}
notifications = {}

ACTIVE_TIMEOUT = 60

UPLOAD_FOLDER = "uploads"
USERS_FILE = "users.json"
CHAT_HISTORY_DIR = ".chat-history"

os.makedirs(CHAT_HISTORY_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==============================
# BROSTORAGE
# ==============================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BROSTORAGE_DIR = os.path.join(
    BASE_DIR,
    ".brostorage",
    "share",
    "allfile"
)

os.makedirs(
    BROSTORAGE_DIR,
    exist_ok=True
)


def register_user():
    ip = request.remote_addr
    active_users[ip] = time.time()


def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        print ("ERR: Can't load JSON, crated new JSON")
        return []


def get_chat_file():
    today = datetime.now().strftime("%d-%m-%Y")
    return os.path.join(CHAT_HISTORY_DIR, f"{today}.txt")


@app.route("/api/me")
def get_me():
    register_user()

    client_ip = request.remote_addr
    users = load_users()

    for user in users:
        if user["ip"] == client_ip:
            return jsonify({
                "id": user["id"],
                "ip": client_ip
            })

    return jsonify({
        "id": None,
        "ip": client_ip
    })


@app.route("/api/users")
def api_users():
    register_user()

    users = load_users()
    now = time.time()

    user_list = []

    for user in users:
        ip = user["ip"]

        is_online = (
            ip in active_users
            and now - active_users[ip] <= ACTIVE_TIMEOUT
        )

        user_list.append({
            "id": user["id"],
            "online": is_online
        })

    return jsonify(user_list)


@app.route("/register", methods=["POST"])
def register():
    ip = request.remote_addr
    user_id = ip.split(".")[-1]

    users = load_users()

    for user in users:
        if user["ip"] == ip:
            register_user()

            return jsonify({
                "message": "You are already registered!",
                "id": user["id"]
            })

    new_user = {
        "id": user_id,
        "ip": ip
    }

    users.append(new_user)

    with open(USERS_FILE, "w", encoding="utf-8") as file:
        json.dump(users, file, indent=4)

    register_user()

    return jsonify({
        "message": "Registration successful!",
        "id": user_id
    })


@app.route("/api/chat/send", methods=["POST"])
def chat_send():
    register_user()

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Invalid JSON"
        }), 400

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Empty message"
        }), 400

    ip = request.remote_addr
    user_id = ip.split(".")[-1]

    ping_match = re.search(
        r'@ID<(\d+)>',
        message
    )

    if ping_match:
        target_id = ping_match.group(1)

        if target_id != user_id:
            if target_id not in notifications:
                notifications[target_id] = []

            notification = {
                "from": user_id,
                "message": message,
                "time": datetime.now().strftime("%H:%M:%S")
            }

            notifications[target_id].append(notification)

            print(
                f"PING: User {user_id} -> User {target_id}"
            )

    now = datetime.now().strftime("%H:%M:%S")

    line = f"[{now}] ({user_id}) {message}\n"

    chat_file = get_chat_file()

    with open(chat_file, "a", encoding="utf-8") as file:
        file.write(line)

    return jsonify({
        "status": "sent"
    })


@app.route("/api/chat/history")
def chat_history():
    register_user()

    chat_file = get_chat_file()

    if not os.path.exists(chat_file):
        return jsonify([])

    with open(chat_file, "r", encoding="utf-8") as file:
        messages = file.readlines()

    return jsonify(messages)


@app.route("/api/notifications")
def get_notifications():
    register_user()

    client_ip = request.remote_addr
    users = load_users()

    current_user = None

    for user in users:
        if user["ip"] == client_ip:
            current_user = user
            break

    if not current_user:
        return jsonify([])

    user_id = current_user["id"]

    user_notifications = notifications.get(
        user_id,
        []
    )

    notifications[user_id] = []

    return jsonify(user_notifications)


@app.route("/api/status")
def status():
    register_user()

    now = time.time()

    active = {
        ip: last_seen
        for ip, last_seen in active_users.items()
        if now - last_seen <= ACTIVE_TIMEOUT
    }

    active_users.clear()
    active_users.update(active)

    users = load_users()

    return jsonify({
        "active_users": len(active_users),
        "registered_users": len(users)
    })


@app.route("/upload", methods=["POST"])
def upload():
    register_user()

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    target = request.form.get("target")

    if not target:
        return jsonify({
            "error": "No target user selected"
        }), 400

    if file.filename == "":
        return jsonify({
            "error": "No selected file"
        }), 400

    users = load_users()

    target_exists = any(
        user["id"] == target
        for user in users
    )

    if not target_exists:
        return jsonify({
            "error": "Target user does not exist"
        }), 404

    inbox_dir = os.path.join(
        UPLOAD_FOLDER,
        "inbox",
        target
    )

    os.makedirs(
        inbox_dir,
        exist_ok=True
    )

    filepath = os.path.join(
        inbox_dir,
        file.filename
    )

    file.save(filepath)

    return jsonify({
        "message": f"File sent to User {target}!",
        "filename": file.filename,
        "target": target
    })


#====================
# API: PUSHUP SERVICE
#=========================
@app.route("/api/pushup/inbox")
def pushup_inbox():
    register_user()

    client_ip = request.remote_addr

    users = load_users()

    current_user = next(
        (
            user
            for user in users
            if user["ip"] == client_ip
        ),
        None
    )

    if not current_user:
        return jsonify({
            "error": "User not registered"
        }), 403

    user_id = current_user["id"]

    inbox_dir = os.path.join(
        UPLOAD_FOLDER,
        "inbox",
        user_id
    )

    if not os.path.exists(inbox_dir):
        return jsonify([])

    files = []

    for filename in os.listdir(inbox_dir):

        filepath = os.path.join(
            inbox_dir,
            filename
        )

        if os.path.isfile(filepath):

            files.append({
                "filename": filename,
                "url": (
                    f"/uploads/inbox/"
                    f"{user_id}/"
                    f"{filename}"
                )
            })

    return jsonify(files)


# ========================================================
# BROSTORAGE: LIST FILES
# ========================================================

@app.route(
    "/api/brostorage/files",
    methods=["GET"]
)
def brostorage_files():

    register_user()

    files = []

    for filename in os.listdir(
        BROSTORAGE_DIR
    ):

        filepath = os.path.join(
            BROSTORAGE_DIR,
            filename
        )

        if not os.path.isfile(filepath):
            continue

        files.append({
            "name": filename,
            "size": os.path.getsize(filepath)
        })

    return jsonify({
        "files": files
    })

# ========================================================
# BROSTORAGE: UPLOAD
# ========================================================

@app.route(
    "/api/brostorage/upload",
    methods=["POST"]
)
def brostorage_upload():

    register_user()

    if "file" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({
            "error": "No selected file"
        }), 400

    filename = os.path.basename(
        file.filename
    )

    filepath = os.path.join(
        BROSTORAGE_DIR,
        filename
    )

    file.save(filepath)

    return jsonify({
        "message": "File uploaded!",
        "filename": filename
    })



# ========================================================
# BROSTORAGE: DOWNLOAD
# ========================================================

@app.route(
    "/api/brostorage/download/<path:filename>",
    methods=["GET"]
)
def brostorage_download(filename):

    register_user()

    filename = os.path.basename(
        filename
    )

    filepath = os.path.join(
        BROSTORAGE_DIR,
        filename
    )

    if not os.path.isfile(filepath):

        return jsonify({
            "error": "File not found"
        }), 404

    return send_from_directory(
        BROSTORAGE_DIR,
        filename,
        as_attachment=True
    )

# ========================================================
# BROSTORAGE: DELETE
# ========================================================

@app.route(
    "/api/brostorage/delete/<path:filename>",
    methods=["DELETE"]
)
def brostorage_delete(filename):

    register_user()

    filename = os.path.basename(
        filename
    )

    filepath = os.path.join(
        BROSTORAGE_DIR,
        filename
    )

    if not os.path.isfile(filepath):

        return jsonify({
            "error": "File not found"
        }), 404

    try:

        os.remove(filepath)

    except OSError:

        return jsonify({
            "error": "Unable to delete file"
        }), 500

    return jsonify({
        "message": "File deleted!",
        "filename": filename
    })

# ============================================================
# BROTERNET: POSTS API
# ============================================================

BROTERNET_POSTS_DIR = "broternet/.posts"

BROTERNET_INTERACTIONS_DIR = \
    "broternet/.interactions"

BROTERNET_LIKES_DIR = os.path.join(
    BROTERNET_INTERACTIONS_DIR,
    "likes"
)

BROTERNET_COMMENTS_DIR = os.path.join(
    BROTERNET_INTERACTIONS_DIR,
    "comments"
)

os.makedirs(
    BROTERNET_LIKES_DIR,
    exist_ok=True
)

os.makedirs(
    BROTERNET_COMMENTS_DIR,
    exist_ok=True
)

os.makedirs(
    BROTERNET_POSTS_DIR,
    exist_ok=True
)


@app.route(
    "/api/broternet/posts",
    methods=["GET", "POST"]
)
def broternet_posts():
    register_user()

    # ========================================================
    # CREATE POST
    # ========================================================
    if request.method == "POST":

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Invalid JSON"
            }), 400

        title = data.get(
            "title",
            ""
        ).strip()

        content = data.get(
            "content",
            ""
        ).strip()

        if not title or not content:
            return jsonify({
                "error":
                    "Title and content are required"
            }), 400

        client_ip = request.remote_addr

        users = load_users()

        user_id = client_ip.split(".")[-1]

        for user in users:

            if user["ip"] == client_ip:

                user_id = user["id"]

                break


        date = datetime.now().strftime(
            "%d-%m-%Y"
        )


        # Unique ID for this post

        post_id = uuid.uuid4().hex


        post = {

            "id": post_id,

            "user_id": str(user_id),

            "title": title,

            "content": content,

            "attachment": None,

            "date": date

        }


        filename = (
            f"{date}-{user_id}-{post_id}.json"
        )


        filepath = os.path.join(

            BROTERNET_POSTS_DIR,

            filename

        )


        with open(

            filepath,

            "w",

            encoding="utf-8"

        ) as file:

            json.dump(

                post,

                file,

                indent=4,

                ensure_ascii=False

            )


        return jsonify({
            "message": "Post published!",
            "post": post
        })



    # ========================================================
    # LOAD POSTS
    # ========================================================

    posts = []

    for filename in os.listdir(
        BROTERNET_POSTS_DIR
    ):

        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_POSTS_DIR,
            filename
        )

        try:

            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:

                post = json.load(file)

                posts.append(post)

        except (
            json.JSONDecodeError,
            OSError
        ):

            print(
                f"Unable to load post: {filename}"
            )

    return jsonify(posts)

# ========================================================
# BROTERNET: DELETE POST API
# ========================================================

@app.route(
    "/api/broternet/posts/<post_id>",
    methods=["DELETE"]
)
def broternet_delete_post(post_id):

    register_user()

    # FIND CURRENT USER
    client_ip = request.remote_addr
    users = load_users()

    current_user_id = \
        client_ip.split(".")[-1]

    for user in users:
        if user["ip"] == client_ip:
            current_user_id = user["id"]
            break

    current_user_id = str(
        current_user_id
    )

    post_filepath = None
    post = None

    # FIND POST
    for filename in os.listdir(
        BROTERNET_POSTS_DIR
    ):
        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_POSTS_DIR,
            filename
        )

        try:
            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:
                loaded_post = json.load(file)

            if str(
                loaded_post.get("id", "")
            ) == str(post_id):

                post_filepath = filepath
                post = loaded_post
                break

        except (
            json.JSONDecodeError,
            OSError
        ):
            continue

    # POST NOT FOUND
    if post_filepath is None:
        return jsonify({
            "error": "Post not found"
        }), 404

    # CHECK POST OWNER
    post_owner_id = str(
        post.get("user_id", "")
    )

    if post_owner_id != current_user_id:
        return jsonify({
            "error":
            "Bro really trying to delete someone else's post?"
        }), 403

    # DELETE POST
    try:
        os.remove(post_filepath)
    except OSError:
        return jsonify({
            "error": "Unable to delete post"
        }), 500

    # DELETE LIKES
    like_filepath = os.path.join(
        BROTERNET_LIKES_DIR,
        f"{post_id}.json"
    )

    if os.path.exists(like_filepath):
        try:
            os.remove(like_filepath)
        except OSError:
            pass

    # DELETE COMMENTS
    comment_filepath = os.path.join(
        BROTERNET_COMMENTS_DIR,
        f"{post_id}.json"
    )

    if os.path.exists(comment_filepath):
        try:
            os.remove(comment_filepath)
        except OSError:
            pass

    return jsonify({
        "message": "Post deleted!"
    })
# ========================================================
# BROTERNET: LIKE API
# ========================================================

@app.route(
    "/api/broternet/posts/<post_id>/like",
    methods=["GET","POST"]
)
def broternet_like_post(post_id):

    register_user()

    # ----------------------------------------------------
    # FIND CURRENT USER
    # ----------------------------------------------------

    client_ip = request.remote_addr

    users = load_users()

    current_user_id = \
        client_ip.split(".")[-1]

    for user in users:

        if user["ip"] == client_ip:

            current_user_id = user["id"]

            break

    current_user_id = str(
        current_user_id
    )


    # ----------------------------------------------------
    # CHECK POST EXISTS
    # ----------------------------------------------------

    post_exists = False

    for filename in os.listdir(
        BROTERNET_POSTS_DIR
    ):

        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_POSTS_DIR,
            filename
        )

        try:

            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:

                post = json.load(file)

            if str(
                post.get("id", "")
            ) == str(post_id):

                post_exists = True

                break

        except (
            json.JSONDecodeError,
            OSError
        ):

            continue


    if not post_exists:

        return jsonify({
            "error": "Post not found"
        }), 404


    # ----------------------------------------------------
    # LOAD LIKES
    # ----------------------------------------------------

    like_filepath = os.path.join(
        BROTERNET_LIKES_DIR,
        f"{post_id}.json"
    )

    likes = []


    if os.path.exists(like_filepath):

        try:

            with open(
                like_filepath,
                "r",
                encoding="utf-8"
            ) as file:

                likes = json.load(file)

        except (
            json.JSONDecodeError,
            OSError
        ):

            likes = []


    likes = [
        str(user_id)
        for user_id in likes
    ]

    # GET LIKE STATUS
    if request.method == "GET":
        return jsonify({
            "liked": current_user_id in likes,
            "count": len(likes)
        })


    # ----------------------------------------------------
    # TOGGLE LIKE
    # ----------------------------------------------------

    if current_user_id in likes:

        likes.remove(
            current_user_id
        )

        liked = False

    else:

        likes.append(
            current_user_id
        )

        liked = True


    # ----------------------------------------------------
    # SAVE LIKES
    # ----------------------------------------------------

    with open(
        like_filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            likes,
            file,
            indent=4,
            ensure_ascii=False
        )


    return jsonify({

        "liked":
            liked,

        "count":
            len(likes)

    })

# ========================================================
# BROTERNET: COMMENT API
# ========================================================

@app.route(
    "/api/broternet/posts/<post_id>/comments",
    methods=["GET", "POST"]
)
def broternet_comments(post_id):

    register_user()

    # FIND CURRENT USER
    client_ip = request.remote_addr
    users = load_users()

    current_user_id = \
        client_ip.split(".")[-1]

    for user in users:
        if user["ip"] == client_ip:
            current_user_id = user["id"]
            break

    current_user_id = str(
        current_user_id
    )

    # CHECK POST EXISTS
    post_exists = False

    for filename in os.listdir(
        BROTERNET_POSTS_DIR
    ):
        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_POSTS_DIR,
            filename
        )

        try:
            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:
                post = json.load(file)

            if str(
                post.get("id", "")
            ) == str(post_id):
                post_exists = True
                break

        except (
            json.JSONDecodeError,
            OSError
        ):
            continue

    if not post_exists:
        return jsonify({
            "error": "Post not found"
        }), 404

    # COMMENT FILE
    comment_filepath = os.path.join(
        BROTERNET_COMMENTS_DIR,
        f"{post_id}.json"
    )

    comments = []

    if os.path.exists(
        comment_filepath
    ):
        try:
            with open(
                comment_filepath,
                "r",
                encoding="utf-8"
            ) as file:
                comments = json.load(file)

        except (
            json.JSONDecodeError,
            OSError
        ):
            comments = []

    # GET COMMENTS
    if request.method == "GET":
        return jsonify({
            "comments": comments,
            "count": len(comments)
        })

    # CREATE COMMENT
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Invalid JSON"
        }), 400

    content = data.get(
        "content",
        ""
    ).strip()

    if not content:
        return jsonify({
            "error": "Comment cannot be empty"
        }), 400

    comment = {
        "id": uuid.uuid4().hex,
        "user_id": current_user_id,
        "content": content,
        "date": datetime.now().strftime(
            "%d-%m-%Y"
        )
    }

    comments.append(comment)

    with open(
        comment_filepath,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            comments,
            file,
            indent=4,
            ensure_ascii=False
        )

    return jsonify({
        "comment": comment,
        "count": len(comments)
    })

# ============================================================
# BROTERNET: MEDIA UPLOAD
# ============================================================

BROTERNET_MEDIA_DIR = "uploads/broternet"

BROTERNET_MUSIC_UPLOAD_DIR = os.path.join(
    BROTERNET_MEDIA_DIR,
    "music"
)

BROTERNET_VIDEO_UPLOAD_DIR = os.path.join(
    BROTERNET_MEDIA_DIR,
    "video"
)


os.makedirs(
    BROTERNET_MUSIC_UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    BROTERNET_VIDEO_UPLOAD_DIR,
    exist_ok=True
)


# ============================================================
# MUSIC UPLOAD
# ============================================================

@app.route(
    "/api/broternet/music/upload",
    methods=["POST"]
)
def broternet_music_upload():
    register_user()

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No selected file"
        }), 400


    allowed_types = {
        "audio/mpeg",
        "audio/mp3"
    }


    if (
        not file.filename.lower().endswith(".mp3")
        or file.mimetype not in allowed_types
    ):
        return jsonify({
            "error": "Only MP3 files are allowed"
        }), 400


    filename = (
        f"{int(time.time())}_"
        f"{file.filename}"
    )


    filepath = os.path.join(
        BROTERNET_MUSIC_UPLOAD_DIR,
        filename
    )

    file.save(filepath)


    return jsonify({

        "message": "Music uploaded!",

        "url": (
            "/uploads/broternet/music/"
            + filename
        )

    })


# ============================================================
# VIDEO UPLOAD
# ============================================================

@app.route(
    "/api/broternet/video/upload",
    methods=["POST"]
)
def broternet_video_upload():
    register_user()

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No selected file"
        }), 400


    allowed_types = {
        "video/mp4"
    }


    if (
        not file.filename.lower().endswith(".mp4")
        or file.mimetype not in allowed_types
    ):
        return jsonify({
            "error": "Only MP4 files are allowed"
        }), 400


    filename = (
        f"{int(time.time())}_"
        f"{file.filename}"
    )


    filepath = os.path.join(
        BROTERNET_VIDEO_UPLOAD_DIR,
        filename
    )

    file.save(filepath)


    return jsonify({

        "message": "Video uploaded!",

        "url": (
            "/uploads/broternet/video/"
            + filename
        )

    })

# ============================================================
# BROTERNET: VIDEOS API
# ============================================================

BROTERNET_VIDEOS_DIR = "broternet/.videos"

os.makedirs(
    BROTERNET_VIDEOS_DIR,
    exist_ok=True
)

BROTERNET_VIDEO_DOWNLOAD_JOBS = {}
BROTERNET_VIDEO_DOWNLOAD_PROCESSES = {}
BROTERNET_VIDEO_DOWNLOAD_THREADS = set()
BROTERNET_VIDEO_DOWNLOAD_LOCK = threading.Lock()
BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN = threading.Event()


def broternet_video_download_progress(line, job):
    match = re.search(r"(\d+(?:\.\d+)?)%", line)

    if not match:
        return

    job["progress"] = float(match.group(1))

    speed_match = re.search(r"\bat\s+(\S+)", line)
    eta_match = re.search(r"\bETA\s+(\S+)", line)

    if speed_match:
        job["speed"] = speed_match.group(1)

    if eta_match:
        job["eta"] = eta_match.group(1)


def broternet_video_download_worker(
    job_id,
    command,
    title,
    video_type,
    source,
    date,
    user_id,
    timestamp,
    download_name,
    local_filepath,
):
    job = BROTERNET_VIDEO_DOWNLOAD_JOBS[job_id]
    process = None

    try:
        if BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN.is_set():
            return

        job["status"] = "starting"

        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        with BROTERNET_VIDEO_DOWNLOAD_LOCK:
            BROTERNET_VIDEO_DOWNLOAD_PROCESSES[job_id] = process

        job["status"] = "downloading"

        for line in process.stdout:
            if BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN.is_set():
                break

            broternet_video_download_progress(line, job)

        if BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN.is_set():
            process.terminate()
            process.wait(timeout=5)
            return

        return_code = process.wait()

        if return_code != 0:
            job["status"] = "failed"
            job["error"] = "Unable to download YouTube video"
            return

        if not os.path.isfile(local_filepath):
            job["status"] = "failed"
            job["error"] = (
                "Video download completed but MP4 was not found"
            )
            return

        local_filename = download_name + ".mp4"
        video = {
            "title": title,
            "type": video_type,
            "source": source,
            "date": date,
            "id": user_id,
            "local_source": (
                "/uploads/broternet/video/"
                + local_filename
            )
        }

        filename = f"{date}-{user_id}-{timestamp}.json"
        filepath = os.path.join(
            BROTERNET_VIDEOS_DIR,
            filename
        )

        with open(
            filepath,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                video,
                file,
                indent=4,
                ensure_ascii=False
            )

        job["progress"] = 100
        job["status"] = "completed"
        job["video"] = video

    except FileNotFoundError:
        job["status"] = "failed"
        job["error"] = "yt-dlp is not installed on the server"

    except (OSError, subprocess.SubprocessError) as error:
        if not BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN.is_set():
            print("yt-dlp failed:", error)
        job["status"] = "failed"
        job["error"] = "Unable to download YouTube video"

    finally:
        if process is not None:
            stdout = process.stdout

            if stdout is not None:
                close_stdout = getattr(
                    stdout,
                    "close",
                    None
                )

                if close_stdout:
                    close_stdout()

        with BROTERNET_VIDEO_DOWNLOAD_LOCK:
            BROTERNET_VIDEO_DOWNLOAD_PROCESSES.pop(job_id, None)
            BROTERNET_VIDEO_DOWNLOAD_THREADS.discard(
                threading.current_thread()
            )


def stop_broternet_video_downloads():
    BROTERNET_VIDEO_DOWNLOAD_SHUTTING_DOWN.set()

    with BROTERNET_VIDEO_DOWNLOAD_LOCK:
        processes = list(
            BROTERNET_VIDEO_DOWNLOAD_PROCESSES.values()
        )
        threads = list(BROTERNET_VIDEO_DOWNLOAD_THREADS)

    for process in processes:
        if process.poll() is None:
            process.terminate()

    for thread in threads:
        thread.join(timeout=5)


atexit.register(stop_broternet_video_downloads)


def is_youtube_url(url):
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()

        return hostname in {
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "youtu.be"
        }

    except Exception:
        return False


@app.route(
    "/api/broternet/videos",
    methods=["GET", "POST"]
)
def broternet_videos():
    register_user()

    if request.method == "POST":

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Invalid JSON"
            }), 400


        title = data.get(
            "title",
            ""
        ).strip()

        video_type = data.get(
            "type",
            ""
        ).strip()

        source = data.get(
            "source",
            ""
        ).strip()


        if not title or not source:
            return jsonify({
                "error":
                    "Title and video source are required"
            }), 400


        if video_type not in [
            "mp4",
            "embed"
        ]:
            return jsonify({
                "error":
                    "Video type must be local or embed"
            }), 400


        client_ip = request.remote_addr
        users = load_users()

        user_id = client_ip.split(".")[-1]

        for user in users:

            if user["ip"] == client_ip:
                user_id = user["id"]
                break


        date = datetime.now().strftime(
            "%d-%m-%Y"
        )

        timestamp = datetime.now().strftime(
            "%H%M%S"
        )


        local_source = None


        # ====================================================
        # YOUTUBE DOWNLOAD
        # ====================================================

        if video_type == "embed":

            if not is_youtube_url(source):
                return jsonify({
                    "error":
                        "Only YouTube videos are supported"
                }), 400


            download_name = (
                f"{date}-{user_id}-{timestamp}"
            )

            output_template = os.path.join(
                BROTERNET_VIDEO_UPLOAD_DIR,
                download_name + ".%(ext)s"
            )


            command = [
                "yt-dlp",

                "--no-playlist",
                "--newline",
                "--progress",

                "--format",
                "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "--recode-video",
                "mp4",

                "--output",
                output_template,

                source
            ]

            local_filename = (
                download_name
                + ".mp4"
            )


            local_filepath = os.path.join(
                BROTERNET_VIDEO_UPLOAD_DIR,
                local_filename
            )

            job_id = str(uuid.uuid4())
            BROTERNET_VIDEO_DOWNLOAD_JOBS[job_id] = {
                "status": "queued",
                "progress": 0,
                "speed": None,
                "eta": None
            }

            thread = threading.Thread(
                target=broternet_video_download_worker,
                args=(
                    job_id,
                    command,
                    title,
                    video_type,
                    source,
                    date,
                    user_id,
                    timestamp,
                    download_name,
                    local_filepath
                )
            )

            with BROTERNET_VIDEO_DOWNLOAD_LOCK:
                BROTERNET_VIDEO_DOWNLOAD_THREADS.add(thread)

            thread.start()

            return jsonify({
                "job_id": job_id
            }), 202


        # ====================================================
        # VIDEO METADATA
        # ====================================================

        video = {
            "title": title,
            "type": video_type,
            "source": source,
            "date": date,
            "id": user_id
        }


        if local_source:

            video["local_source"] = local_source


        filename = (
            f"{date}-{user_id}-{timestamp}.json"
        )

        filepath = os.path.join(
            BROTERNET_VIDEOS_DIR,
            filename
        )


        with open(
            filepath,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                video,
                file,
                indent=4,
                ensure_ascii=False
            )


        return jsonify({
            "message": "Video published!",
            "video": video
        })


    videos = []

    for filename in os.listdir(
        BROTERNET_VIDEOS_DIR
    ):

        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_VIDEOS_DIR,
            filename
        )

        try:

            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:

                video = json.load(file)

                videos.append(video)

        except (
            json.JSONDecodeError,
            OSError
        ):

            print(
                f"Unable to load video: {filename}"
            )

    return jsonify(videos)


@app.route(
    "/api/broternet/videos/download-status/<job_id>",
    methods=["GET"]
)
def broternet_video_download_status(job_id):
    job = BROTERNET_VIDEO_DOWNLOAD_JOBS.get(job_id)

    if not job:
        return jsonify({
            "error": "Download job not found"
        }), 404

    return jsonify(job)


# ============================================================
# BROTERNET: MUSIC API
# ============================================================

BROTERNET_MUSIC_DIR = "broternet/.music"

os.makedirs(
    BROTERNET_MUSIC_DIR,
    exist_ok=True
)


@app.route(
    "/api/broternet/music",
    methods=["GET", "POST"]
)
def broternet_music():
    register_user()

    if request.method == "POST":

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Invalid JSON"
            }), 400

        title = data.get(
            "title",
            ""
        ).strip()

        artist = data.get(
            "artist",
            ""
        ).strip()

        source = data.get(
            "source",
            ""
        ).strip()

        if not title or not source:
            return jsonify({
                "error":
                    "Title and music source are required"
            }), 400

        client_ip = request.remote_addr
        users = load_users()

        user_id = client_ip.split(".")[-1]

        for user in users:
            if user["ip"] == client_ip:
                user_id = user["id"]
                break

        date = datetime.now().strftime(
            "%d-%m-%Y"
        )

        timestamp = datetime.now().strftime(
            "%H%M%S"
        )

        music = {
            "title": title,
            "artist": artist,
            "source": source,
            "date": date,
            "id": user_id
        }

        filename = (
            f"{date}-{user_id}-{timestamp}.json"
        )

        filepath = os.path.join(
            BROTERNET_MUSIC_DIR,
            filename
        )

        with open(
            filepath,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                music,
                file,
                indent=4,
                ensure_ascii=False
            )

        return jsonify({
            "message": "Music published!",
            "music": music
        })


    music_list = []

    for filename in os.listdir(
        BROTERNET_MUSIC_DIR
    ):

        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(
            BROTERNET_MUSIC_DIR,
            filename
        )

        try:

            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:

                music = json.load(file)

                music_list.append(music)

        except (
            json.JSONDecodeError,
            OSError
        ):

            print(
                f"Unable to load music: {filename}"
            )

    return jsonify(music_list)


# ============================================================
# BROTERNET: IMAGE POSTS API
# ============================================================

BROTERNET_IMAGES_DIR = "broternet/.images"
BROTERNET_IMAGE_UPLOAD_DIR = (
    "broternet/uploads/images"
)

ALLOWED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif"
}


os.makedirs(
    BROTERNET_IMAGES_DIR,
    exist_ok=True
)

os.makedirs(
    BROTERNET_IMAGE_UPLOAD_DIR,
    exist_ok=True
)


@app.route(
    "/api/broternet/images",
    methods=["GET", "POST"]
)
def broternet_images():

    register_user()

    # ----------------------------------------
    # GET IMAGE POSTS
    # ----------------------------------------

    if request.method == "GET":

        images = []

        for filename in os.listdir(
            BROTERNET_IMAGES_DIR
        ):

            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(
                BROTERNET_IMAGES_DIR,
                filename
            )

            try:

                with open(
                    filepath,
                    "r",
                    encoding="utf-8"
                ) as file:

                    image = json.load(file)

                    images.append(image)

            except (
                OSError,
                json.JSONDecodeError
            ):

                print(
                    f"Unable to load image post: "
                    f"{filename}"
                )

        return jsonify(images)


    # ----------------------------------------
    # CREATE IMAGE POST
    # ----------------------------------------

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Invalid JSON"
        }), 400


    title = data.get(
        "title",
        ""
    ).strip()
    content = data.get(
        "content",
        ""
    ).strip()

    source = data.get(
        "source",
        ""
    ).strip()


    if not title or not source:

        return jsonify({
            "error":
                "Title and image source are required"
        }), 400


    client_ip = request.remote_addr

    users = load_users()

    user_id = client_ip.split(".")[-1]


    for user in users:

        if user["ip"] == client_ip:

            user_id = user["id"]

            break


    date = datetime.now().strftime(
        "%d-%m-%Y"
    )


    image_post = {
        "title": title,
        "content":content,
        "source": source,
        "date": date,
        "id": user_id
    }


    timestamp = datetime.now().strftime(
        "%H%M%S"
    )


    filename = (
        f"{date}-{user_id}-{timestamp}.json"
    )


    filepath = os.path.join(
        BROTERNET_IMAGES_DIR,
        filename
    )


    with open(
        filepath,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            image_post,
            file,
            indent=4,
            ensure_ascii=False
        )


    return jsonify({
        "message": "Image post published!",
        "image": image_post
    })


# ============================================================
# IMAGE UPLOAD
# ============================================================

@app.route(
    "/api/broternet/images/upload",
    methods=["POST"]
)
def upload_broternet_image():

    register_user()


    if "file" not in request.files:

        return jsonify({
            "error": "No image uploaded"
        }), 400


    file = request.files["file"]


    if file.filename == "":

        return jsonify({
            "error": "No selected image"
        }), 400


    extension = os.path.splitext(
        file.filename
    )[1].lower()


    if extension not in ALLOWED_IMAGE_EXTENSIONS:

        return jsonify({
            "error":
                "Only PNG, JPG, JPEG, WEBP and GIF "
                "are allowed"
        }), 400


    client_ip = request.remote_addr

    user_id = client_ip.split(".")[-1]

    users = load_users()


    for user in users:

        if user["ip"] == client_ip:

            user_id = user["id"]

            break


    timestamp = datetime.now().strftime(
        "%Y%m%d-%H%M%S"
    )


    filename = (
        f"{user_id}-{timestamp}{extension}"
    )


    filepath = os.path.join(
        BROTERNET_IMAGE_UPLOAD_DIR,
        filename
    )


    file.save(filepath)


    url = (
        "/broternet/uploads/images/"
        + filename
    )


    return jsonify({
        "message": "Image uploaded!",
        "url": url
    })


# ============================================================
# NETWORK DISCOVERY
# ============================================================

@app.route(
    "/api/network/devices"
)
def network_devices():

    register_user()

    try:

        result = subprocess.run(
            [
                "ip",
                "neigh"
            ],
            capture_output=True,
            text=True,
            timeout=5
        )

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


    devices = []


    for line in result.stdout.splitlines():

        parts = line.split()


        if len(parts) < 2:
            continue


        ip = parts[0]
        if ":" in ip:
            continue
        state = parts[-1]


        device = {
            "ip": ip,
            "state": state
        }


        if "lladdr" in parts:

            mac_index = parts.index(
                "lladdr"
            )


            if mac_index + 1 < len(parts):

                device["mac"] = (
                    parts[mac_index + 1]
                )


        if "dev" in parts:

            dev_index = parts.index(
                "dev"
            )


            if dev_index + 1 < len(parts):

                device["interface"] = (
                    parts[dev_index + 1]
                )


        devices.append(device)


    return jsonify(devices)

# =========================
# BROTERMINAL
# =========================

@app.route(
    "/api/terminal",
    methods=["POST"]
)
def terminal():

    register_user()

    client_ip = request.remote_addr

    users = load_users()

    current_user = next(
        (
            user
            for user in users
            if user["ip"] == client_ip
        ),
        None
    )

    if not current_user:
        return jsonify({
            "error": "User not registered"
        }), 403

    user_id = current_user["id"]
    data = request.get_json()

    if not data:
        return jsonify({
            "err": "Invalid JSON"
        }), 400

    command = data.get(
        "command",
        ""
    ).strip()

    if not command:
        return jsonify({
            "err": "Empty command"
        }), 400


    if command == "whoami":

        return jsonify({
            "output": str(user_id)
        })


    if command == "active":
        return jsonify({
            "output":
                "User active:\n" +
                "\n".join(
                    str(user_id)
                    for user_id in active_users
                )
        })

    if command == "pwd":

        return jsonify({
            "output": f"/home/{user_id}"
        })


    if command == "ls":

        return jsonify({
            "output": "brotools  home  shared"
        })


    if command == "help":

        return jsonify({
            "output":
                "whoami\n"
                "active\n"
                "pwd\n"
                "ls\n"
                "echo\n"
                "which\n"
                "help\n"
                "clear"
        })


    if command == "clear":

        return jsonify({
            "output": "",
            "clear": True
        })


    if command.startswith("echo "):

        return jsonify({
            "output": command[5:]
        })


    return jsonify({
        "output":
            command +
            ": bro...command not exist!"
    })

@app.route("/")
def home():
    register_user()

    return send_from_directory(
        ".",
        "index.html"
    )

'''===========================
DM CHAT
=============================
'''
@app.route("/lchat.html/ID=@<target_id>")
def lchat_dm(target_id):
    register_user()

    return send_from_directory(
        ".",
        "lchat.html"
    )
'''===========================
PRIVATE DM CHAT
=============================
'''

DM_CHAT_DIR = ".chat-history"

os.makedirs(
    DM_CHAT_DIR,
    exist_ok=True
)


def get_dm_file(user_a, user_b):

    ids = sorted([
        str(user_a),
        str(user_b)
    ])

    filename = (
        f"dm-{ids[0]}-{ids[1]}.txt"
    )

    return os.path.join(
        DM_CHAT_DIR,
        filename
    )


@app.route(
    "/api/dm/<target_id>",
    methods=["GET", "POST"]
)
def dm_chat(target_id):

    register_user()

    client_ip = request.remote_addr
    users = load_users()

    current_user = next(
        (
            user
            for user in users
            if user["ip"] == client_ip
        ),
        None
    )

    if not current_user:
        return jsonify({
            "error": "User not registered"
        }), 403

    user_id = str(current_user["id"])
    target_id = str(target_id)

    if user_id == target_id:
        return jsonify({
            "error": "Cannot DM yourself"
        }), 400

    target_exists = any(
        str(user["id"]) == target_id
        for user in users
    )

    if not target_exists:
        return jsonify({
            "error": "Target user does not exist"
        }), 404

    chat_file = get_dm_file(
        user_id,
        target_id
    )

    if request.method == "POST":

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "Invalid JSON"
            }), 400

        message = data.get(
            "message",
            ""
        ).strip()

        if not message:
            return jsonify({
                "error": "Empty message"
            }), 400

        now = datetime.now().strftime(
            "%H:%M:%S"
        )

        line = (
            f"[{now}] "
            f"({user_id}) "
            f"{message}\n"
        )

        with open(
            chat_file,
            "a",
            encoding="utf-8"
        ) as file:
            file.write(line)

        return jsonify({
            "status": "sent"
        })

    if not os.path.exists(chat_file):
        return jsonify([])

    with open(
        chat_file,
        "r",
        encoding="utf-8"
    ) as file:
        messages = file.readlines()

    return jsonify(messages)

@app.route("/<path:filename>")
def static_files(filename):
    register_user()

    return send_from_directory(
        ".",
        filename
    )


if __name__ == "__main__":
    print("BRO NETWORK BACKEND ONLINE")

    app.run(
        host="0.0.0.0",
        port=8080
    )
