from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    DONOR = "DONOR"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"

class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class UserBase(BaseModel):
    phone: str
    full_name: str
    role: UserRole = UserRole.DONOR
    blood_type: Optional[str] = "UNKNOWN"
    lat: Optional[float] = None
    lng: Optional[float] = None

class UserCreate(UserBase):
    password: Optional[str] = None
    email: Optional[str] = None

class UserLogin(BaseModel):
    phone: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

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
    transaction_type: str
    note: Optional[str] = None

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    blood_type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class RecommendationRequest(BaseModel):
    hospital_id: int
    blood_type: str
    radius_km: float = 10
    top_n: int = 10
    w_blood: float = 0.4
    w_distance: float = 0.25
    w_eligibility: float = 0.2
    w_reliability: float = 0.15
