from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from .models import UserRole, BorrowStatus

# user & auth schemas

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.MEMBER

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type:str
    role: str
    full_name: str

# book schemas

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    category: str = "General"
    cover_url: Optional[str] = None
    total_copies: int = 1

class BookCreate(BookBase):
    pass

class BookUpdate(BookBase):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    cover_url: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None

class BookResponse(BookBase):
    id : int
    available_copies: int

    model_config = ConfigDict(from_attributes = True)

# borrow log schemasn
class BorrowLogResponse(BaseModel):
    id: int
    book_id: int
    user_id: int
    borrow_date: datetime
    return_date: Optional[datetime] =None
    status: BorrowStatus
    book: Optional[BookResponse] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes = True)

    