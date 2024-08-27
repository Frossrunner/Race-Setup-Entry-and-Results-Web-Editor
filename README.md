# Race-Setup-Entry-and-Results-Web-Editor

This is a web-based application designed to manage various aspects of an athletics club, including user registration, login, and event management. The system includes features for administrators and users to manage participants, events, results, and more. The application ensures security with encryption and provides multiple editors for different management tasks.

## Features

- **User Authentication**: Secure login and registration system.
- **Event Management**: Create, update, and manage events for the athletics club.
- **Entrant Management**: Register entrants, assign them to events, and manage their information.
- **Results Management**: Add and publish results for different events.
- **Declarations Management**: Handle entrant declarations and generate heats.
- **Profile Management**: Users can view and manage their profile information.
- **API Endpoints**: A backend powered by `app.js` managing all necessary API endpoints.

## Project Structure

- **login.html**: Login page for user authentication.
- **register.html**: Registration page for new users.
- **profile.html**: User profile page with options to view and edit details.
- **events_editor.html**: Interface for creating and managing events.
- **entrants_editor.html**: Interface for managing entrant lists for each event.
- **results_editor.html**: Interface for inputting and posting event results.
- **declarations_editor.html**: Interface for handling entrant declarations and heat generation.
- **entrant_form.html**: Multi-step form for registering entrants into events.

## Technologies Used

- **HTML/CSS**: Frontend structure and styling.
- **JavaScript**: Client-side scripting and form handling.
- **Node.js**: Backend server handling all API requests (`app.js`).
- **Express.js**: Node.js framework for building web applications.
- **Encryption**: All sensitive data, such as passwords, is encrypted to ensure security.
- **Font Awesome**: Icons for better visual representation in the UI.

## Installation

### Prerequisites

- **Node.js**: Ensure that Node.js is installed on your system.
- **npm**: Node.js package manager should also be installed.
