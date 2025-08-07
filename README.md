# Virtual Community Manager

A voice-enabled Virtual Community Manager that handles support management and community engagement through a web interface.

## Features

- **Support Management**
  - Voice-based complaint logging
  - Automated ticket creation and tracking
  - Priority-based assignment

- **Community Engagement**
  - Event recommendations
  - Event promotion tools
  - Feedback collection and analytics

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd NexGen_hackathon
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Project Structure

- `main.py` - FastAPI backend application
- `templates/` - Frontend templates
  - `index.html` - Main dashboard
- `data/` - JSON data storage
  - `tickets.json` - Ticket data
  - `events.json` - Event data
  - `feedback.json` - Feedback data

## API Endpoints

### Tickets
- `GET /tickets/` - List all tickets
- `POST /tickets/` - Create a new ticket
- `GET /tickets/{ticket_id}` - Get ticket details

### Events
- `GET /events/` - List all events
- `POST /events/` - Create a new event

### Feedback
- `POST /feedback/` - Submit event feedback

## License

This project is licensed under the MIT License.
