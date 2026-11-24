from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/borrow", tags=["Borrow"])

MAX_ACTIVE_BOOKS = 3
LOAN_DAYS = 14


@router.post("/{book_id}", response_model=schemas.BorrowLogResponse, status_code=status.HTTP_201_CREATED)
def borrow_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    active_count = (
        db.query(models.BorrowLog)
        .filter(
            models.BorrowLog.user_id == current_user.id,
            models.BorrowLog.status == models.BorrowStatus.ACTIVE,
        )
        .count()
    )
    if active_count >= MAX_ACTIVE_BOOKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Borrowing limit reached ({MAX_ACTIVE_BOOKS} active books max).",
        )

    already_borrowed = (
        db.query(models.BorrowLog)
        .filter(
            models.BorrowLog.user_id == current_user.id,
            models.BorrowLog.book_id == book_id,
            models.BorrowLog.status == models.BorrowStatus.ACTIVE,
        )
        .first()
    )
    if already_borrowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active copy of this book.",
        )

    book = (
        db.query(models.Book)
        .filter(models.Book.id == book_id)
        .with_for_update()
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No copies currently available.",
        )

    now = datetime.now(timezone.utc)
    borrow_log = models.BorrowLog(
        user_id=current_user.id,
        book_id=book.id,
        borrow_date=now,
        due_date=now + timedelta(days=LOAN_DAYS),
        status=models.BorrowStatus.ACTIVE,
    )
    book.available_copies -= 1

    db.add(borrow_log)
    db.commit()
    db.refresh(borrow_log)
    return borrow_log


@router.post("/return/{log_id}", response_model=schemas.BorrowLogResponse)
def return_book(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    log = db.query(models.BorrowLog).filter(models.BorrowLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow record not found.")

    if log.user_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return this book.",
        )

    if log.status == models.BorrowStatus.RETURNED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This book has already been returned.",
        )

    book = db.query(models.Book).filter(models.Book.id == log.book_id).with_for_update().first()

    log.status = models.BorrowStatus.RETURNED
    log.return_date = datetime.now(timezone.utc)
    if book and book.available_copies < book.total_copies:
        book.available_copies += 1

    db.commit()
    db.refresh(log)
    return log


@router.get("/my-books", response_model=List[schemas.BorrowLogResponse])
def get_my_borrowed_books(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.BorrowLog)
        .options(joinedload(models.BorrowLog.book))
        .filter(models.BorrowLog.user_id == current_user.id)
        .order_by(models.BorrowLog.borrow_date.desc())
        .all()
    )


@router.get("/admin/all-logs", response_model=List[schemas.BorrowLogResponse])
def get_all_borrow_logs(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    return (
        db.query(models.BorrowLog)
        .options(joinedload(models.BorrowLog.book), joinedload(models.BorrowLog.user))
        .order_by(models.BorrowLog.id.desc())
        .all()
    )


@router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    now = datetime.now(timezone.utc)
    books = db.query(models.Book).all()
    total_titles = len(books)
    total_copies = sum(b.total_copies for b in books)

    active_logs = (
        db.query(models.BorrowLog)
        .filter(models.BorrowLog.status == models.BorrowStatus.ACTIVE)
        .all()
    )
    active_loans = len(active_logs)

    overdue_loans = 0
    for log in active_logs:
        if log.due_date:
            due = log.due_date if log.due_date.tzinfo else log.due_date.replace(tzinfo=timezone.utc)
            if due < now:
                overdue_loans += 1

    total_members = (
        db.query(models.User)
        .filter(models.User.role == models.UserRole.MEMBER)
        .count()
    )

    return {
        "total_titles": total_titles,
        "total_copies": total_copies,
        "active_loans": active_loans,
        "overdue_loans": overdue_loans,
        "total_members": total_members,
    }