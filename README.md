**🌸 Task Tracker — Real-time Cloud-based Productivity App**

🔗 Live Demo: https://varshat14.github.io/TaskTracker/

🧠 Overview
Task Tracker is a real-time task management web application built using JavaScript, HTML, CSS, and Firebase.
It enables users to create, edit, organize, and manage personal tasks securely with authentication and live cloud sync.
The app features a light lavender glassmorphism-inspired UI for a clean, modern, and soothing user experience.

🚀 Features
🔐 Authentication & Privacy
 - Firebase Email/Password Authentication for secure sign-in and registration
 - Each user has private task data, securely stored in Firebase Realtime Database

✅ Real-time Task Management
 - Add, edit, complete, or delete tasks instantly with real-time updates
 - Tasks sync automatically across all devices logged into the same account

📅 Enhanced Functionality
 - Add due dates for better planning
 - Built-in filters to view “All,” “Active,” or “Completed” tasks
 - Drag-and-drop reordering for personalized task arrangement

💎 Modern UI/UX Design
 - Glassmorphism effect with translucent lavender panels
 - Smooth hover transitions, soft shadows, and blur effects

🛠️ Tech Stack
| Technology                     | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| **HTML5**                      | Structure and layout of the web app         |
| **CSS3 (Glassmorphism theme)** | Modern UI design with blur and transparency |
| **JavaScript (ES6)**           | Frontend logic and event handling           |
| **Firebase Authentication**    | Secure login & registration system          |
| **Firebase Realtime Database** | Live task synchronization and storage       |

📂 Project Structure
task-tracker/
├── index.html          # Main app layout and auth modal
├── styles.css          # Glassmorphism styling and responsiveness
├── app.js              # Firebase config + logic for auth and CRUD
└── README.md           # Project documentation

⚙️ How It Works
User Authentication
 - Users can sign in or create an account securely via Firebase Auth.
Task Management
 - After login, tasks are fetched from the user’s node in Firebase (e.g., /tasks/{uid}/).
 - Each task includes properties like title, dueDate, completed, and order.
Real-time Sync
 - Firebase listens for data changes in real time, updating the task list instantly.
UI Interaction
 - Users can drag-and-drop to reorder tasks.
 - All updates reflect immediately in Firebase and across sessions.

🧩 Future Enhancements
 - Dark mode toggle
 - PWA (Progressive Web App) for offline task access
 - Reminder notifications
 - Task tags and priority levels
 - Productivity analytics dashboard

👩‍💻 Author
Varsha T
🎓 B.E. in Information Science and Engineering (2022–2026)
💼 Passionate about Frontend Development, UI/UX Design, and Cloud-integrated Web Apps

Clean typography for clarity and focus

Fully responsive — works seamlessly on desktops, tablets, and mobiles
