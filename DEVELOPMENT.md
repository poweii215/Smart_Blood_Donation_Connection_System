# 👨‍💻 Hướng Dẫn Phát Triển (Development Guide)

> Hướng dẫn chi tiết cho developers cần phát triển và mở rộng SBDCS

---

## 📋 Mục lục

- [Cấu trúc project](#cấu-trúc-project)
- [Setup development environment](#setup-development-environment)
- [Backend development](#backend-development)
- [Frontend development](#frontend-development)
- [Database management](#database-management)
- [API development](#api-development)
- [Testing](#testing)
- [Best practices](#best-practices)

---

## 📁 Cấu Trúc Project

```
SBDCS_2/
├── backend/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── database.py               # Database connection & models
│   ├── schemas.py                # Pydantic request/response models
│   ├── requirements.txt           # Python dependencies
│   ├── core/
│   │   ├── config.py             # Environment config
│   │   ├── security.py           # JWT, password hashing
│   │   └── constants.py          # App constants
│   ├── routers/
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── donors.py             # Donor management
│   │   ├── appointments.py       # Appointment management
│   │   ├── blood_inventory.py    # Blood stock management
│   │   ├── hospitals.py          # Hospital admin
│   │   ├── analytics.py          # Analytics & reports
│   │   └── notifications.py      # Notification system
│   └── db_helpers.py             # Database utility functions
│
├── frontend/
│   ├── package.json              # Node dependencies
│   ├── package-lock.json
│   ├── vite.config.js           # Vite bundler config
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── tsconfig.json            # TypeScript config (if using)
│   ├── index.html               # HTML entry point
│   ├── public/
│   │   └── images/
│   └── src/
│       ├── main.jsx             # React app entry
│       ├── App.jsx              # Root component
│       ├── pages/
│       │   ├── DonorDashboard.jsx
│       │   ├── HospitalDashboard.jsx
│       │   ├── Appointments.jsx
│       │   ├── BloodInventory.jsx
│       │   ├── Analytics.jsx
│       │   ├── Login.jsx
│       │   └── NotFound.jsx
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Modal.jsx
│       │   ├── Table.jsx
│       │   ├── Form.jsx
│       │   └── ...
│       ├── services/
│       │   ├── api.js           # Axios instance & HTTP client
│       │   ├── auth.js          # Auth API calls
│       │   ├── donors.js        # Donor API calls
│       │   ├── appointments.js  # Appointment API calls
│       │   └── ...
│       ├── store/
│       │   └── useStore.js      # State management (if using)
│       ├── styles/
│       │   ├── globals.css      # Global styles
│       │   └── components.css
│       ├── utils/
│       │   ├── helpers.js       # Utility functions
│       │   ├── validators.js    # Form validation
│       │   ├── formatters.js    # Data formatting
│       │   └── constants.js
│       └── hooks/
│           ├── useAuth.js       # Auth hook
│           └── useFetch.js      # Data fetching hook
│
├── data/                        # Demo/sample data
├── uploads/                     # User uploaded files
├── docker-compose.yml          # Docker development setup
├── docker-compose.dev.yml      # Docker dev-specific setup
├── Dockerfile.backend          # Backend Docker image
├── .env                        # Environment variables (create manually)
├── .env.example                # Example env file
├── .gitignore
├── README.md                   # Main documentation
├── QUICK_START.md              # Quick setup
├── DEVELOPMENT.md              # This file
├── TROUBLESHOOTING.md          # Problem solving
└── render.yaml                 # Render deployment config
```

---

## 🛠️ Setup Development Environment

### 1. Clone Repository

```powershell
git clone <REPOSITORY_URL>
cd SBDCS_2
```

### 2. Backend Setup

```powershell
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file for development
copy .env.example .env
# Edit .env with your settings
```

**Backend .env example:**

```env
DATABASE_URL=sqlite:///database.sqlite
JWT_SECRET=your-dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
EMAIL_MODE=mock
DEBUG=True
```

### 3. Frontend Setup

```powershell
# Install dependencies
cd frontend
npm install

# Create .env file if needed
# (Usually not needed for dev, but example:)
# VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 4. Start Development Servers

**Terminal 1 - Backend:**

```powershell
venv\Scripts\activate
python -m uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```powershell
cd frontend
npm run dev
```

Visit:

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://127.0.0.1:8000/docs`

---

## 🖥️ Backend Development

### Adding New Endpoints

1. **Create router file** (e.g., `backend/routers/new_feature.py`):

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..core.security import get_current_user

router = APIRouter(prefix="/api/new-feature", tags=["new-feature"])

@router.get("/", response_model=list[schemas.ItemResponse])
async def get_items(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all items"""
    items = db.query(ItemModel).filter(ItemModel.user_id == current_user.id).all()
    return items

@router.post("/", response_model=schemas.ItemResponse)
async def create_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new item"""
    db_item = ItemModel(**item.dict(), user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
```

2. **Register router** in `backend/main.py`:

```python
from .routers import new_feature

app.include_router(new_feature.router)
```

3. **Test endpoint** at `http://127.0.0.1:8000/docs`

### Database Migrations

For schema changes:

```python
# 1. Update models in database.py or schemas.py
# 2. For SQLite, delete database.sqlite and restart
# 3. For PostgreSQL, use Alembic (setup if needed)

# Test migrations:
python -c "from backend.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Authentication

- JWT tokens in Authorization header: `Bearer <token>`
- Tokens stored in localStorage (frontend)
- Refresh tokens for extended sessions

---

## ⚛️ Frontend Development

### Component Structure

```javascript
// src/components/ItemCard.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/ItemCard.css";

export default function ItemCard({ item, onDelete }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteItem(item.id);
      onDelete(item.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
```

### API Calls

Use axios in `src/services/api.js`:

```javascript
// src/services/items.js
import api from "./api";

export const getItems = () => api.get("/api/items");
export const createItem = (data) => api.post("/api/items", data);
export const deleteItem = (id) => api.delete(`/api/items/${id}`);
export const updateItem = (id, data) => api.patch(`/api/items/${id}`, data);
```

### State Management

Using custom hooks:

```javascript
// src/hooks/useItems.js
import { useState, useEffect } from "react";
import * as itemsService from "../services/items";

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await itemsService.getItems();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return { items, loading, error, setItems };
};
```

### Styling

Using Tailwind CSS:

```javascript
// src/components/Button.jsx
export default function Button({ variant = "primary", children, ...props }) {
  const baseStyles = "px-4 py-2 rounded font-semibold";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}
```

---

## 💾 Database Management

### Adding New Model

1. **Define in `backend/database.py`:**

```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
```

2. **Create schema in `backend/schemas.py`:**

```python
from pydantic import BaseModel
from datetime import datetime

class ItemBase(BaseModel):
    name: str
    description: str

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

3. **Restart backend** - SQLite will auto-create tables
4. **Add to `.gitignore`:**
   ```
   database.sqlite
   ```

---

## 🔌 API Development

### Request/Response Flow

```
Frontend (React)
     ↓
axios call to /api/endpoint
     ↓
Backend (FastAPI)
     ↓
Router function
     ↓
Database query
     ↓
Pydantic schema validation
     ↓
JSON response
     ↓
Frontend state update
```

### Error Handling

**Backend:**

```python
from fastapi import HTTPException

@router.get("/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

**Frontend:**

```javascript
try {
  const { data } = await getItem(id);
  setItem(data);
} catch (error) {
  if (error.response?.status === 404) {
    setError("Item not found");
  } else {
    setError("Server error");
  }
}
```

---

## 🧪 Testing

### Backend Testing

```powershell
# Install pytest
pip install pytest

# Create test file: backend/tests/test_items.py
# Run tests
pytest backend/tests/ -v
```

**Example test:**

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_items():
    response = client.get("/api/items")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_item():
    response = client.post("/api/items", json={
        "name": "Test Item",
        "description": "Test"
    })
    assert response.status_code == 201
```

### Frontend Testing

```powershell
# Install Vitest (optional)
npm install --save-dev vitest

# Create tests in src/**/*.test.jsx
# Run tests
npm run test
```

---

## ✅ Best Practices

### Backend

- ✅ Use SQLAlchemy ORM for queries
- ✅ Validate input with Pydantic
- ✅ Use dependency injection (Depends)
- ✅ Separate concerns (routers, schemas, models)
- ✅ Add docstrings to functions
- ✅ Use environment variables for config
- ✅ Log errors properly

### Frontend

- ✅ Keep components small and focused
- ✅ Use hooks for state management
- ✅ Separate API calls into services
- ✅ Handle errors gracefully
- ✅ Use meaningful component names
- ✅ Comment complex logic
- ✅ Test critical features

### General

- ✅ Follow project naming conventions
- ✅ Write meaningful commit messages
- ✅ Document new features
- ✅ Don't commit secrets (.env)
- ✅ Keep dependencies updated
- ✅ Test before pushing

---

## 🚀 Deployment Checklist

- [ ] Update version number
- [ ] Test all features locally
- [ ] Update README if needed
- [ ] Set production environment variables
- [ ] Build frontend: `npm run build`
- [ ] Run backend tests
- [ ] Build Docker images: `docker-compose build`
- [ ] Test with Docker Compose
- [ ] Push to repository
- [ ] Deploy via render.yaml or CI/CD

---

**Happy coding! 🎉**
