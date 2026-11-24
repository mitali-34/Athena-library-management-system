from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import  datetime, timezone
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    MEMBER = "Member"

class BorrowStatus(str, enum.Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER, nullable=False)

    borrow_logs = relationship("BorrowLog", back_populates = "user")

class Book(Base):
    __tablename__ = "books"
    

    id = Column(Integer, primary_key= True, index = True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index = True, nullable = False)
    isbn = Column(String, unique=True, index = True, nullable = False)
    category = Column(String, default = "General")
    cover_url = Column(String, nullable=True)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    
    borrow_logs = relationship("BorrowLog", back_populates="book")

class BorrowLog(Base):
    __tablename__ = "borrow_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    borrow_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)
    status = Column(Enum(BorrowStatus), default=BorrowStatus.ACTIVE, nullable=False)

    user = relationship("User", back_populates="borrow_logs")
    book = relationship("Book", back_populates="borrow_logs")