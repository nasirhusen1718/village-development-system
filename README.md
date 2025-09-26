# Village Development System

A comprehensive web application for managing and tracking village development issues across different sectors.

## 🚀 Features

### Backend (FastAPI)
- **RESTful API** with automatic documentation at `/docs`
- **Dashboard Analytics** with sector distribution and status summaries
- **Real-time Data** with SQLite database
- **Authentication System** with role-based access
- **WebSocket Support** for real-time updates

### Frontend (React + Vite)
- **Modern UI** with Tailwind CSS
- **Interactive Charts** with Chart.js integration
- **Responsive Design** for all screen sizes
- **Real-time Updates** with toast notifications
- **Loading States** and error handling

## 📊 Dashboard Features

### Enhanced Officer Dashboard
- **Status Overview Cards** with trend indicators
- **Interactive Sector Distribution** (Pie/Bar charts)
- **Quick Action Buttons** with confirmation modals
- **Recent Activity Feed**
- **Real-time Data Refresh**
- **Error Handling** with retry functionality

### Key Components
- `StatusCard` - Displays metrics with icons and trends
- `SectorDistribution` - Interactive charts with multiple view modes
- `ConfirmationModal` - User-friendly confirmation dialogs
- `LoadingSpinner` - Elegant loading states

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Pydantic** - Data validation and serialization
- **JWT** - Authentication tokens

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Heroicons** - Beautiful icons
- **React Toastify** - Toast notifications

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
source venv/bin/activate  # or use your virtual environment
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8003
- **API Documentation**: http://localhost:8003/docs

## 📈 Dashboard API Endpoints

### GET /dashboard/sector-distribution
Returns problem distribution across sectors:
```json
{
  "distribution": {
    "healthcare": 24,
    "agriculture": 2,
    "village": 0,
    "education": 5,
    "water": 0
  }
}
```

### GET /dashboard/status-summary
Returns status summary statistics:
```json
{
  "pending": 21,
  "in_progress": 0,
  "resolved": 0,
  "escalated": 0,
  "total_month": 21
}
```

## 🎨 UI Features

### Status Cards
- Color-coded borders and icons
- Trend indicators with percentages
- Hover effects and animations
- Custom icons support

### Charts
- Interactive Pie and Bar charts
- Responsive design
- Loading and error states
- Customizable colors and styling

### Modals
- Confirmation dialogs
- Loading overlays
- Error handling
- Responsive design

## 🔧 Development

### Adding New Features
1. **Backend**: Add new routes in `app/routes/`
2. **Frontend**: Create new components in `src/components/`
3. **API Integration**: Use the existing API service patterns

### Styling
- Use Tailwind CSS classes
- Follow the existing color scheme
- Maintain responsive design patterns

### State Management
- Use React hooks for local state
- Implement proper loading and error states
- Add toast notifications for user feedback

## 📝 Notes

- All dependencies are properly installed
- Both servers run on different ports to avoid conflicts
- The application is fully responsive
- Error handling is implemented throughout
- Real-time updates are supported

## 🔮 Future Enhancements

- User authentication UI
- Advanced filtering and search
- Export functionality
- Mobile app development
- Advanced analytics
- Multi-language support

---

**Built with ❤️ for village development and community empowerment**
