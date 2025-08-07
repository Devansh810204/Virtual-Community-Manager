class VoiceInterface {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.commandHandlers = new Map();
        this.initialize();
    }

    initialize() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            
            // Only process final results
            if (event.results[last].isFinal) {
                this.processVoiceCommand(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.isListening = false;
            this.updateUI();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Restart recognition if still supposed to be listening
                this.recognition.start();
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not initialized');
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.updateUI();
            console.log('Voice recognition started');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI();
            console.log('Voice recognition stopped');
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    registerCommand(pattern, handler) {
        this.commandHandlers.set(pattern, handler);
    }

    processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        
        // Convert to lowercase for case-insensitive matching
        const command = transcript.toLowerCase();
        
        // Check for ticket status queries with more flexible matching
        const ticketStatusMatch = command.match(/(?:what's|what is|check|status).*?(?:ticket|issue|request)[^\d]*(\d+)/i) || 
                                command.match(/(?:ticket|issue|request)[^\d]*(\d+).*?(?:status|update)/i);
        
        if (ticketStatusMatch) {
            const ticketId = ticketStatusMatch[1];
            this.handleTicketStatus(ticketId);
            return;
        }
        
        // Check for new ticket creation
        if (command.includes('create a new ticket') || command.includes('report an issue')) {
            this.handleNewTicket(command);
            return;
        }
        
        // Check for event queries
        if (command.includes('upcoming events') || command.includes('what events are coming up')) {
            this.handleEventQuery();
            return;
        }
        
        // Check for help
        if (command.includes('help') || command.includes('what can you do')) {
            this.showHelp();
            return;
        }
        
        // If no command matched, show default response
        this.speak("I'm not sure how to help with that. Say 'help' to know what I can do.");
    }
    
    async handleTicketStatus(ticketId) {
        try {
            // Show loading indicator
            this.speak(`Checking status of ticket ${ticketId}...`);
            
            const response = await fetch(`/tickets/`);
            if (!response.ok) {
                throw new Error('Failed to fetch tickets');
            }
            
            const tickets = await response.json();
            const ticket = tickets.find(t => t.id.includes(ticketId));
            
            if (!ticket) {
                this.speak(`I couldn't find ticket ${ticketId}. Please check the number and try again.`);
                return;
            }
            
            let responseText = `Ticket ${ticketId} is currently ${ticket.status.toLowerCase()}. `;
            responseText += `It's a priority ${ticket.priority} issue. `;
            
            if (ticket.assigned_to) {
                responseText += `It has been assigned to ${ticket.assigned_to}. `;
            }
            
            if (ticket.status.toLowerCase() === 'resolved' && ticket.resolved_at) {
                const resolvedDate = new Date(ticket.resolved_at).toLocaleDateString();
                responseText += `This issue was resolved on ${resolvedDate}.`;
            } else if (ticket.status.toLowerCase() === 'in progress') {
                responseText += 'The team is working on it right now.';
            } else {
                responseText += 'The team will address it as soon as possible.';
            }
            
            this.speak(responseText);
            
        } catch (error) {
            console.error('Error fetching ticket status:', error);
            this.speak(`I'm having trouble accessing the ticket system. Please try again later.`);
        }
    }
    
    async handleNewTicket(transcript) {
        // First, ask for the issue if not provided
        if (!/(issue|problem|ticket|request|maintenance)/i.test(transcript)) {
            this.speak("I can help you create a maintenance request. Please describe the issue you're experiencing.");
            return;
        }
        
        // Extract ticket details from the transcript
        let title = this.extractFromPattern(transcript, /(?:about|regarding|with|for) (.*?)(?: (?:in|at|with|description|details)|$)/i) || 
                   this.extractFromPattern(transcript, /(?:issue|problem|ticket|request|maintenance) (?:with|in|at)? ?(.*?)(?: (?:in|at|with|description|details)|$)/i) ||
                   'General Maintenance';
        
        // Clean up the title
        title = title.replace(/^(a|an|the) /i, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        // Ask for more details if not provided
        if (!/(description|details|about|regarding|with|for)/i.test(transcript)) {
            this.speak(`I'll create a ticket for ${title}. Could you please provide more details about the issue?`);
            return;
        }
        
        // Extract description
        let description = this.extractFromPattern(transcript, /(?:description|details|about|regarding|issue is|problem is) (.*?)(?: (?:in|at|location)|$)/i) || 
                         'No additional details provided';
        
        // Extract location
        let location = this.extractFromPattern(transcript, /(?:location|in|at|room|apartment|unit) (.*?)(?: (?:description|details)|$)/i) || 
                      this.extractFromPattern(transcript, /(?:in|at) (?:the )?(lobby|gym|pool|parking|elevator|lounge|terrace|hallway|staircase|basement|roof)/i) ||
                      'Not specified';
        
        // Clean up location
        location = location.replace(/^(the|my|our) /i, '').trim();
        
        // Determine priority based on keywords
        let priority = 'P4';
        let priorityReason = '';
        
        if (/(urgent|emergency|immediately|right now|flood|flooding|leak|leaking|flooded|fire|smoke|spark|sparking|electrical shock)/i.test(transcript)) {
            priority = 'P1';
            priorityReason = 'This has been marked as an emergency. The maintenance team will respond immediately.';
        } else if (/(important|as soon as possible|asap|not working|broken|not functioning|stopped working|no (water|power|electricity|heat|ac|air conditioning))/i.test(transcript)) {
            priority = 'P2';
            priorityReason = 'This has been marked as high priority. The team will address it as soon as possible.';
        } else if (/(moderate|medium|normal|minor|small|slight|not urgent)/i.test(transcript)) {
            priority = 'P3';
            priorityReason = 'This has been marked as medium priority. The team will address it during normal business hours.';
        } else {
            priorityReason = 'This has been marked as low priority. The team will address it as soon as they are available.';
        }
        
        // Confirm before creating the ticket
        const confirmationMessage = `I'll create a ${priority} priority ticket for: ${title}. ` +
                                 `Location: ${location}. ` +
                                 `Description: ${description}. ` +
                                 `${priorityReason} Would you like me to submit this request?`;
        
        // In a real implementation, we would show a confirmation dialog here
        // For now, we'll just create the ticket
        this.speak(confirmationMessage);
        
        // Create the ticket
        await this.createTicket({
            title,
            description,
            location,
            priority,
            status: 'Open',
            created_at: new Date().toISOString()
        });
    }
    
    extractFromPattern(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }
    
    async createTicket(ticketData) {
        try {
            this.speak("Creating your ticket now...");
            
            const response = await fetch('/tickets/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ticketData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const ticket = await response.json();
            
            // Format the response message
            let responseMessage = `Your ticket has been created successfully! `;
            responseMessage += `Ticket number is ${ticket.id.substring(0, 8)}. `;
            responseMessage += `It's been marked as priority ${ticket.priority}. `;
            
            if (ticket.priority === 'P1') {
                responseMessage += "This is an emergency ticket and the team has been notified immediately. "
                               + "Please ensure the area is secure and wait for further instructions.";
            } else if (ticket.priority === 'P2') {
                responseMessage += "A team member will be with you as soon as possible, "
                               + "typically within the next 2-4 hours.";
            } else {
                responseMessage += "A team member will address this during normal business hours. "
                               + "You'll receive updates on the status.";
            }
            
            this.speak(responseMessage);
            
            // Refresh the dashboard to show the new ticket
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
            
            return ticket;
            
        } catch (error) {
            console.error('Error creating ticket:', error);
            let errorMessage = "I'm sorry, I encountered an issue while creating your ticket. ";
            
            if (error.message.includes('network')) {
                errorMessage += "It seems there's a network issue. Please check your connection and try again.";
            } else if (error.message.includes('500')) {
                errorMessage += "There's an issue with our server. Please try again in a few minutes.";
            } else {
                errorMessage += "Please try again later or contact support if the problem persists.";
            }
            
            this.speak(errorMessage);
            throw error; // Re-throw to allow callers to handle the error if needed
        }
    }
    
    async handleEventQuery() {
        try {
            const response = await fetch('/events/');
            const events = await response.json();
            
            const upcomingEvents = events
                .filter(event => new Date(event.datetime) > new Date())
                .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            
            if (upcomingEvents.length === 0) {
                this.speak("There are no upcoming events scheduled at the moment.");
                return;
            }
            
            let responseText = `There are ${upcomingEvents.length} upcoming events. `;
            if (upcomingEvents.length === 1) {
                responseText += `The event is ${upcomingEvents[0].title} on ${new Date(upcomingEvents[0].datetime).toLocaleDateString()}.`;
            } else {
                responseText += "The next event is ";
                responseText += `${upcomingEvents[0].title} on ${new Date(upcomingEvents[0].datetime).toLocaleDateString()}. `;
                if (upcomingEvents.length > 1) {
                    responseText += `There are ${upcomingEvents.length - 1} more events coming up.`;
                }
            }
            
            this.speak(responseText);
        } catch (error) {
            console.error('Error fetching events:', error);
            this.speak("I'm having trouble fetching the events right now. Please try again later.");
        }
    }
    
    showHelp() {
        const helpText = "I'm your Virtual Community Assistant. Here's what I can help you with: " +
            "\n\nTICKETS: " +
            "\n• 'Check status of ticket 123' - Get updates on your ticket" +
            "\n• 'Report a problem with my AC' - Create a new maintenance request" +
            "\n• 'I have a leak in my bathroom' - Report an urgent issue" +
            "\n• 'The elevator is not working' - Report a common area issue" +
            "\n\nEVENTS: " +
            "\n• 'What events are coming up?' - See upcoming community events" +
            "\n• 'Any events this weekend?' - Check weekend activities" +
            "\n\nGENERAL: " +
            "\n• 'Help' - Hear this message again" +
            "\n• 'Cancel' - Stop the current action" +
            "\n\nYou can also ask me things like: 'How do I pay rent?' or 'What are the pool hours?'";
            
        this.speak(helpText);
        
        // In a real implementation, we'd show this as text on screen too
        console.log(helpText);
    }
    
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Text-to-speech not supported in this browser');
        }
    }
    
    updateUI() {
        const micButton = document.getElementById('voice-control');
        if (micButton) {
            if (this.isListening) {
                micButton.classList.add('listening');
                micButton.title = 'Listening... Click to stop';
            } else {
                micButton.classList.remove('listening');
                micButton.title = 'Click to speak';
            }
        }
    }
}

// Initialize voice interface when the page loads
let voiceInterface;

document.addEventListener('DOMContentLoaded', () => {
    voiceInterface = new VoiceInterface();
    
    // Add voice control button if it doesn't exist
    if (!document.getElementById('voice-control')) {
        const voiceButton = document.createElement('button');
        voiceButton.id = 'voice-control';
        voiceButton.className = 'fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors';
        voiceButton.title = 'Click to speak';
        voiceButton.innerHTML = '🎤';
        voiceButton.addEventListener('click', () => voiceInterface.toggleListening());
        document.body.appendChild(voiceButton);
    }
    
    // Add some basic styling for the voice interface
    const style = document.createElement('style');
    style.textContent = `
        #voice-control {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
            background-color: #2563eb;
            color: white;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        #voice-control:hover {
            background-color: #1d4ed8;
            transform: scale(1.05);
        }
        
        #voice-control.listening {
            animation: pulse 1.5s infinite;
            background-color: #dc2626;
        }
        
        #voice-control.listening:hover {
            background-color: #b91c1c;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
            }
        }
    `;
    document.head.appendChild(style);
});
