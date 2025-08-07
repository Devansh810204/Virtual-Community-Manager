# 🎙️ Voice-enabled Virtual Community Manager

A comprehensive voice-enabled virtual assistant designed to streamline community management through natural language interactions. Handle maintenance requests, track tickets, manage events, and engage with community members - all through simple voice commands.

![Demo](https://img.shields.io/badge/Demo-Available-success)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)

## ✨ Features

- **Voice-First Interface**
  - Natural language processing for ticket creation and queries
  - Interactive voice responses
  - Support for multiple languages (English by default)

- **Maintenance Management**
  - Create and track maintenance tickets via voice
  - Automatic priority assignment (P1-P4)
  - Real-time status updates

- **Event Management**
  - Upcoming event notifications
  - Event details and RSVP via voice
  - Automated event reminders

- **Community Engagement**
  - Feedback collection and analysis
  - Community announcements
  - Resident support

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Modern web browser with Web Speech API support (Chrome, Edge, Firefox, Safari)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Devansh810204/Virtual-Community-Manager.git
   cd Virtual-Community-Manager
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   uvicorn main:app --reload
   ```

2. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. **Using the Voice Interface**
   - Click the microphone icon to start speaking
   - Try commands like:
     - "Create a new ticket for a leaking pipe in apartment 42"
     - "What's the status of ticket 123?"
     - "What events are happening this week?"

## 🏗️ Project Structure

```
Virtual-Community-Manager/
├── data/                   # JSON data storage
│   ├── tickets.json        # Ticket database
│   ├── events.json         # Event database
│   └── feedback.json       # Feedback database
├── static/                 # Static files
│   └── js/
│       └── voice-interface.js  # Voice interaction logic
├── templates/              # Frontend templates
│   └── index.html          # Main dashboard
├── .gitignore             # Git ignore file
├── LICENSE                # MIT License
├── main.py                # FastAPI application
├── README.md              # This file
├── requirements.txt       # Python dependencies
└── run.bat                # Windows setup script
```

## 🤖 Voice Commands

### Ticket Management
- "Create a new ticket for [issue] in [location]"
- "Report [issue] in [location]"
- "Check status of ticket [number]"
- "Update ticket [number]"

### Event Management
- "What events are coming up?"
- "Are there any events this weekend?"
- "Tell me about [event name]"

### General
- "Help" - Show available commands
- "Cancel" - Stop current action

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Voice interface powered by Web Speech API
- UI components from [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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
