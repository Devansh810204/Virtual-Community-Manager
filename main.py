from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import json
import os
import random

app = FastAPI(title="Virtual Community Manager API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock database
DATA_DIR = "data"
TICKETS_FILE = f"{DATA_DIR}/tickets.json"
EVENTS_FILE = f"{DATA_DIR}/events.json"
FEEDBACK_FILE = f"{DATA_DIR}/feedback.json"

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files with mock data if they don't exist or are empty
def initialize_mock_data():
    # Sample data
    ticket_statuses = ["Open", "In Progress", "Resolved"]
    priorities = ["P1", "P2", "P3", "P4"]
    locations = ["Lobby", "Gym", "Pool", "Parking", "Elevator", "Lounge", "Terrace"]
    event_types = ["Yoga Class", "BBQ Night", "Movie Night", "Book Club", "Fitness Class", "Community Meeting"]
    
    # Initialize tickets
    if not os.path.exists(TICKETS_FILE) or os.path.getsize(TICKETS_FILE) == 0:
        tickets = []
        for i in range(1, 6):
            ticket = {
                "id": str(uuid.uuid4()),
                "title": f"Issue with {random.choice(['AC', 'plumbing', 'electricity', 'elevator', 'parking'])} in {random.choice(locations)}",
                "description": f"Detailed description of the issue {i}",
                "location": random.choice(locations),
                "priority": random.choice(priorities),
                "status": random.choices(ticket_statuses, weights=[0.4, 0.4, 0.2])[0],
                "created_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                "assigned_to": f"Tech {random.randint(1, 5)}"
            }
            if ticket["status"] == "Resolved":
                ticket["resolved_at"] = (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat()
            tickets.append(ticket)
        with open(TICKETS_FILE, "w") as f:
            json.dump(tickets, f, indent=2)
    
    # Initialize events
    if not os.path.exists(EVENTS_FILE) or os.path.getsize(EVENTS_FILE) == 0:
        events = []
        for i in range(1, 6):
            event_date = datetime.now() + timedelta(days=random.randint(1, 30))
            events.append({
                "id": str(uuid.uuid4()),
                "title": f"{random.choice(event_types)} {i}",
                "description": f"Join us for a fun {event_types[i % len(event_types)].lower()}",
                "location": random.choice(locations),
                "datetime": event_date.isoformat(),
                "status": "Upcoming",
                "created_at": (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat(),
                "participants": [f"Resident {j}" for j in range(1, random.randint(5, 20))]
            })
        with open(EVENTS_FILE, "w") as f:
            json.dump(events, f, indent=2)
    
    # Initialize feedback
    if not os.path.exists(FEEDBACK_FILE) or os.path.getsize(FEEDBACK_FILE) == 0:
        feedbacks = []
        event_ids = []
        if os.path.exists(EVENTS_FILE):
            with open(EVENTS_FILE, "r") as f:
                event_ids = [event["id"] for event in json.load(f)]
        
        for event_id in event_ids:
            for _ in range(random.randint(1, 5)):
                feedbacks.append({
                    "id": str(uuid.uuid4()),
                    "event_id": event_id,
                    "rating": random.randint(1, 5),
                    "comments": random.choice([
                        "Great event!", 
                        "Had a wonderful time!", 
                        "Could be better organized.", 
                        "Loved it!", 
                        "Will definitely come again!"
                    ]),
                    "created_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat()
                })
        with open(FEEDBACK_FILE, "w") as f:
            json.dump(feedbacks, f, indent=2)

# Initialize data
initialize_mock_data()

# Models
class Ticket(BaseModel):
    id: str = str(uuid.uuid4())
    title: str
    description: str
    location: str
    priority: str = "P4"
    status: str = "Open"
    created_at: str = datetime.now().isoformat()
    assigned_to: Optional[str] = None
    resolved_at: Optional[str] = None

class Event(BaseModel):
    id: str = str(uuid.uuid4())
    title: str
    description: str
    location: str
    datetime: str
    status: str = "Upcoming"
    created_at: str = datetime.now().isoformat()
    participants: List[str] = []

class Feedback(BaseModel):
    id: str = str(uuid.uuid4())
    event_id: str
    rating: int
    comments: Optional[str] = None
    created_at: str = datetime.now().isoformat()

# Helper functions
def load_data(filename):
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_data(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)

# Routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Ticket endpoints
@app.post("/tickets/", response_model=Ticket)
async def create_ticket(ticket: Ticket):
    tickets = load_data(TICKETS_FILE)
    ticket_dict = ticket.dict()
    tickets.append(ticket_dict)
    save_data(tickets, TICKETS_FILE)
    return ticket

@app.get("/tickets/", response_model=List[Ticket])
async def list_tickets():
    tickets = load_data(TICKETS_FILE)
    # Sort by creation date, newest first
    return sorted(tickets, key=lambda x: x.get('created_at', ''), reverse=True)

@app.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str):
    tickets = load_data(TICKETS_FILE)
    for ticket in tickets:
        if ticket["id"] == ticket_id:
            return ticket
    raise HTTPException(status_code=404, detail="Ticket not found")

# Event endpoints
@app.post("/events/", response_model=Event)
async def create_event(event: Event):
    events = load_data(EVENTS_FILE)
    event_dict = event.dict()
    events.append(event_dict)
    save_data(events, EVENTS_FILE)
    return event

@app.get("/events/", response_model=List[Event])
async def list_events():
    events = load_data(EVENTS_FILE)
    # Sort by datetime, soonest first
    return sorted(events, key=lambda x: x.get('datetime', ''))

# Feedback endpoints
@app.post("/feedback/", response_model=Feedback)
async def submit_feedback(feedback: Feedback):
    feedbacks = load_data(FEEDBACK_FILE)
    feedback_dict = feedback.dict()
    feedbacks.append(feedback_dict)
    save_data(feedbacks, FEEDBACK_FILE)
    return feedback

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
