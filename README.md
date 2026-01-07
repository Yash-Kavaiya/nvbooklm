# nvbooklm

**NVIDIA-themed NotebookLM Clone** - An AI-powered notebook application for document analysis and intelligent Q&A.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)
![Bun](https://img.shields.io/badge/Bun-1.3-000000?logo=bun)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)
![Gemini](https://img.shields.io/badge/Gemini%20AI-2.0-4285F4?logo=google)

## Features

- 📚 **Notebook Management** - Create and organize multiple notebooks
- 📄 **Multi-Source Support** - Import PDFs, documents, web pages, and YouTube videos
- 💬 **AI-Powered Chat** - Ask questions about your sources using Gemini AI
- 🎨 **NVIDIA Dark Theme** - Premium dark mode with NVIDIA green accents

## Project Structure

```
nvbooklm/
├── client/                 # Angular 21 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Core services, models, layout
│   │   │   │   ├── layout/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   └── features/   # Feature modules
│   │   │       ├── dashboard/
│   │   │       └── notebook/
│   │   └── environments/   # Environment configs
│   └── package.json
│
├── server/                 # Bun + Hono Backend
│   ├── index.ts           # API entry point
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 20+ (for Angular CLI)
- **Bun** 1.3+ (for backend server)
- **npm** 10+ (for package management)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yash-Kavaiya/nvbooklm.git
cd nvbooklm

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
bun install
```

### Environment Configuration

1. Copy the environment template:
   ```bash
   # In client/src/environments/
   # Update environment.development.ts with your API keys
   ```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Add your config to `environment.ts`

3. Configure Gemini AI:
   - Get an API key from https://aistudio.google.com/apikey
   - Add the key to `environment.ts`

### Running the Application

**Development mode:**

```bash
# Terminal 1: Start the backend
cd server
bun run dev

# Terminal 2: Start the frontend
cd client
npm start
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/notebooks` | List all notebooks |
| POST | `/api/notebooks` | Create notebook |
| GET | `/api/notebooks/:id` | Get notebook |
| GET | `/api/notebooks/:id/sources` | List sources |
| POST | `/api/notebooks/:id/sources` | Add source |
| POST | `/api/chat` | Send chat message |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Angular 21, Angular Material |
| Backend | Bun, Hono |
| AI | Google Gemini 2.0 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Styling | SCSS, Material Design |

## License

MIT License - see [LICENSE](LICENSE) for details.