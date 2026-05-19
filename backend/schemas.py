from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    DONOR = "DONOR"
    ADMIN = "ADMIN"

class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    blood_type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    token: str
    user: dict

class BloodInventoryBase(BaseModel):
    hospital_id: int
    blood_type: str
    quantity: float
    safety_threshold: float

class AppointmentBase(BaseModel):
    hospital_id: int
    appointment_date: str
    notes: Optional[str] = None
    pre_screening_result: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class InventoryTransactionCreate(BaseModel):
    hospital_id: int
    blood_type: str
    quantity: float
    transaction_type: str # IN or OUT
    note: Optional[str] = None

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    blood_type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
