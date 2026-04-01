from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import json
import uuid
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

# Import your existing modules
import sys
sys.path.append(os.path.dirname(__file__))
from pdf_processing import extract_text_from_pdf, rebuild_paragraphs, paragraph_based_chunking
from vector_store import store_chunks, answer_question, search_chunks

app = FastAPI(title="Smart File Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
PDF_DIR = BASE_DIR / "pdfs"
DATA_DIR = BASE_DIR / "data"
PDF_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / "users.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"
SUMMARIES_FILE = DATA_DIR / "summaries.json"
CHAT_HISTORY_FILE = DATA_DIR / "chat_history.json"

# ─── Helpers ──────────────────────────────────────────────────────────────────
def load_json(path: Path, default):
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return default

def save_json(path: Path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ─── Auth Models ──────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    token: str
    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class ChatRequest(BaseModel):
    token: str
    question: str
    session_id: Optional[str] = None

class NewSessionRequest(BaseModel):
    token: str
    title: Optional[str] = "New Chat"

# ─── Auth Utilities ───────────────────────────────────────────────────────────
def get_user_by_token(token: str):
    sessions = load_json(SESSIONS_FILE, {})
    session = sessions.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    users = load_json(USERS_FILE, {})
    user = users.get(session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user, session["user_id"]

# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.post("/auth/signup")
def signup(req: SignupRequest):
    users = load_json(USERS_FILE, {})
    # Check duplicate email
    for u in users.values():
        if u["email"] == req.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    users[user_id] = {
        "id": user_id,
        "username": req.username,
        "email": req.email,
        "password": hash_password(req.password),
        "created_at": datetime.now().isoformat()
    }
    save_json(USERS_FILE, users)
    return {"message": "Account created successfully"}

@app.post("/auth/login")
def login(req: LoginRequest):
    users = load_json(USERS_FILE, {})
    user_id = None
    user = None
    for uid, u in users.items():
        if u["email"] == req.email and u["password"] == hash_password(req.password):
            user_id = uid
            user = u
            break
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = str(uuid.uuid4())
    sessions = load_json(SESSIONS_FILE, {})
    sessions[token] = {"user_id": user_id, "created_at": datetime.now().isoformat()}
    save_json(SESSIONS_FILE, sessions)
    return {
        "token": token,
        "user": {"id": user_id, "username": user["username"], "email": user["email"], "created_at": user["created_at"]}
    }

@app.post("/auth/logout")
def logout(token: str):
    sessions = load_json(SESSIONS_FILE, {})
    sessions.pop(token, None)
    save_json(SESSIONS_FILE, sessions)
    return {"message": "Logged out"}

# ─── Profile Routes ───────────────────────────────────────────────────────────
@app.get("/profile")
def get_profile(token: str):
    user, _ = get_user_by_token(token)
    return {"username": user["username"], "email": user["email"], "created_at": user["created_at"]}

@app.put("/profile")
def update_profile(req: UpdateProfileRequest):
    user, user_id = get_user_by_token(req.token)
    users = load_json(USERS_FILE, {})

    if req.username:
        users[user_id]["username"] = req.username

    if req.new_password:
        if not req.current_password or users[user_id]["password"] != hash_password(req.current_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        users[user_id]["password"] = hash_password(req.new_password)

    save_json(USERS_FILE, users)
    return {"message": "Profile updated", "username": users[user_id]["username"]}

# ─── PDF Routes ───────────────────────────────────────────────────────────────
@app.get("/pdfs")
def list_pdfs(token: str):
    get_user_by_token(token)
    summaries = load_json(SUMMARIES_FILE, {})
    pdf_files = list(PDF_DIR.glob("*.pdf"))
    result = []
    for f in pdf_files:
        ns = f.stem
        result.append({
            "filename": f.name,
            "namespace": ns,
            "summary": summaries.get(ns, {}).get("summary", None),
            "key_insights": summaries.get(ns, {}).get("key_insights", []),
            "indexed": summaries.get(ns, {}) != {}
        })
    return result

@app.post("/pdfs/index")
def index_all_pdfs(token: str):
    get_user_by_token(token)
    pdf_files = list(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        raise HTTPException(status_code=404, detail="No PDFs found in the pdfs/ directory")

    summaries = load_json(SUMMARIES_FILE, {})
    results = []

    for pdf_path in pdf_files:
        ns = pdf_path.stem
        with open(pdf_path, "rb") as f:
            class FakeFile:
                def __init__(self, data, name):
                    self.name = name
                    self._data = data
                def read(self):
                    return self._data
            fake = FakeFile(f.read(), pdf_path.name)

        raw_text = extract_text_from_pdf(fake)
        paragraphs = rebuild_paragraphs(raw_text)
        chunks = paragraph_based_chunking(paragraphs)
        count = store_chunks(chunks, ns)

        # Generate summary using OpenAI
        try:
            from openai import OpenAI
            from dotenv import load_dotenv
            load_dotenv()
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            sample_text = " ".join(paragraphs[:10])[:3000]
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                max_tokens=400,
                messages=[
                    {"role": "system", "content": "You are a document summarizer. Return JSON only with keys 'summary' (2-3 sentences) and 'key_insights' (list of 4-5 short strings). No markdown."},
                    {"role": "user", "content": f"Summarize this document:\n\n{sample_text}"}
                ]
            )
            import re
            raw = resp.choices[0].message.content.strip()
            raw = re.sub(r"```json|```", "", raw).strip()
            parsed = json.loads(raw)
            summaries[ns] = parsed
        except Exception as e:
            summaries[ns] = {
                "summary": f"Document indexed with {count} chunks.",
                "key_insights": ["Content indexed and ready for querying."]
            }

        results.append({"filename": pdf_path.name, "chunks": count})

    save_json(SUMMARIES_FILE, summaries)
    return {"indexed": results, "summaries": summaries}

# ─── Chat Session Routes ──────────────────────────────────────────────────────
@app.get("/chat/sessions")
def get_sessions(token: str):
    user, user_id = get_user_by_token(token)
    history = load_json(CHAT_HISTORY_FILE, {})
    user_sessions = history.get(user_id, {})
    sessions_list = [
        {
            "session_id": sid,
            "title": s.get("title", "Chat"),
            "created_at": s.get("created_at"),
            "message_count": len(s.get("messages", []))
        }
        for sid, s in user_sessions.items()
    ]
    sessions_list.sort(key=lambda x: x["created_at"], reverse=True)
    return sessions_list

@app.post("/chat/sessions")
def create_session(req: NewSessionRequest):
    user, user_id = get_user_by_token(req.token)
    history = load_json(CHAT_HISTORY_FILE, {})
    if user_id not in history:
        history[user_id] = {}
    session_id = str(uuid.uuid4())
    history[user_id][session_id] = {
        "title": req.title,
        "created_at": datetime.now().isoformat(),
        "messages": []
    }
    save_json(CHAT_HISTORY_FILE, history)
    return {"session_id": session_id, "title": req.title}

@app.get("/chat/sessions/{session_id}")
def get_session_messages(session_id: str, token: str):
    user, user_id = get_user_by_token(token)
    history = load_json(CHAT_HISTORY_FILE, {})
    session = history.get(user_id, {}).get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str, token: str):
    user, user_id = get_user_by_token(token)
    history = load_json(CHAT_HISTORY_FILE, {})
    if session_id in history.get(user_id, {}):
        del history[user_id][session_id]
        save_json(CHAT_HISTORY_FILE, history)
    return {"message": "Session deleted"}

@app.post("/chat")
def chat(req: ChatRequest):
    user, user_id = get_user_by_token(req.token)
    history = load_json(CHAT_HISTORY_FILE, {})

    if user_id not in history:
        history[user_id] = {}

    session_id = req.session_id
    if not session_id or session_id not in history[user_id]:
        session_id = str(uuid.uuid4())
        history[user_id][session_id] = {
            "title": req.question[:40] + ("..." if len(req.question) > 40 else ""),
            "created_at": datetime.now().isoformat(),
            "messages": []
        }

    answer = answer_question(req.question)

    history[user_id][session_id]["messages"].append({
        "role": "user", "content": req.question, "timestamp": datetime.now().isoformat()
    })
    history[user_id][session_id]["messages"].append({
        "role": "assistant", "content": answer, "timestamp": datetime.now().isoformat()
    })
    save_json(CHAT_HISTORY_FILE, history)

    return {"answer": answer, "session_id": session_id}