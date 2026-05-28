# Smart File Assistant

A full-stack web application that allows users to interact with PDF documents using AI-powered chat. Place PDF files in the backend directory, index them, then ask questions about your documents, get summaries, and maintain chat history across multiple sessions.

## 🌟 Features

- **PDF Processing & Indexing** - Place PDF files in the backend directory and index them for search
- **AI-Powered Chat** - Ask questions about your indexed documents and get intelligent responses
- **Session Management** - Create and manage multiple chat sessions
- **Chat History** - Keep track of all conversations across sessions
- **Document Summaries** - Get automatic summaries of your documents
- **User Authentication** - Secure login and user management
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark/Light Theme** - Toggle between dark and light modes

## 📋 Project Structure

```
notebook_web/Context_Pdf/
├── backend/                 # FastAPI server
│   ├── main.py             # API endpoints and application setup
│   ├── pdf_processing.py   # PDF text extraction and chunking
│   ├── vector_store.py     # Vector storage and semantic search
│   ├── requirements.txt    # Python dependencies
│   ├── data/               # Persistent data storage
│   │   ├── users.json
│   │   ├── sessions.json
│   │   ├── summaries.json
│   │   └── chat_history.json
│   └── pdfs/               # PDF files for processing (place PDFs here)
│
└── frontend/               # React + Vite application
    ├── src/
    │   ├── App.jsx         # Main app component
    │   ├── main.jsx        # Entry point
    │   ├── api/            # API client utilities
    │   ├── components/     # Reusable React components
    │   ├── context/        # React context (Auth, Theme)
    │   └── pages/          # Page components
    │       ├── AuthPage.jsx
    │       ├── ChatPage.jsx
    │       ├── HomePage.jsx
    │       └── ProfilePage.jsx
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the server:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📦 Dependencies

### Backend
- **FastAPI** - Modern web framework for building APIs
- **Pydantic** - Data validation using Python type annotations
- **CORS** - Cross-Origin Resource Sharing middleware
- **PyPDF/Text Processing** - PDF text extraction and processing
- **Vector Storage** - Semantic search and similarity matching

### Frontend
- **React 19** - UI library
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## 🔧 API Endpoints

The backend provides the following main endpoints:

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /pdfs` - List available PDF files in the backend/pdfs/ directory
- `POST /pdfs/index` - Index all PDFs and generate summaries
- `POST /chat` - Send a chat question about indexed PDFs
- `GET /chat/sessions` - List all chat sessions for the user
- `POST /chat/sessions` - Create a new chat session
- `GET /chat/sessions/{session_id}` - Get messages for a specific session
- `DELETE /chat/sessions/{session_id}` - Delete a chat session

## 🔐 Authentication

The application uses JSON-based user management for authentication. User credentials and sessions are stored in the `data/` directory.

## 💾 Data Storage

All data is persisted in JSON files within the `backend/data/` directory:

- **users.json** - User account information
- **sessions.json** - Chat session data
- **chat_history.json** - Conversation history
- **summaries.json** - Document summaries

## 🎨 Theme Support

The application includes a theme context that allows users to switch between light and dark modes. Theme preference can be saved for persistent use.

## � Adding PDFs to the Project

Since the project does not have a web-based upload feature, PDFs are placed directly in the backend directory:

1. **Place PDF files** in `backend/pdfs/` directory
2. **Start the backend server**
3. **Call the `/pdfs/index` API endpoint** with a valid user token to process and index all PDFs
4. **Wait for indexing to complete** - The system will extract text, create chunks, and generate summaries
5. **Start chatting** - Use the chat interface to ask questions about the indexed documents

## �📱 Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🛠️ Development

### Backend Development

To run the backend with auto-reload:
```bash
pip install uvicorn
uvicorn main:app --reload
```

API documentation available at `http://localhost:8000/docs`

### Frontend Development

For hot module replacement during development:
```bash
npm run dev
```

### Building for Production

**Backend:**
```bash
# Create a production-ready environment
python -m venv venv_prod
source venv_prod/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

## 📝 Environment Configuration

Create a `.env` file in the backend directory if needed for configuration:

```env
# Backend configuration
API_HOST=localhost
API_PORT=8000
```

## 🐛 Troubleshooting

### CORS Issues
- Ensure the backend is running on `http://localhost:8000`
- Ensure the frontend is running on `http://localhost:5173`
- CORS is pre-configured for these URLs

### PDFs Not Indexed
- Ensure PDF files are placed in the `backend/pdfs/` directory
- Verify the directory exists and is readable
- Call the `/pdfs/index` endpoint after adding PDFs
- Check that you have a valid user token

### Chat Not Working
- Verify both frontend and backend are running
- Check browser console for API errors
- Ensure API is accessible at `http://localhost:8000`
- Make sure PDFs have been indexed using the `/pdfs/index` endpoint
- Verify OpenAI API key is configured (for automatic summaries)

## Note:The functionality of this project requires an API key for gpt-3.5 turbo 

## 📄 License

This project is provided as-is for educational and personal use.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📧 Support

For issues or questions, please open an issue in the repository.

---

**Last Updated:** May 2026
