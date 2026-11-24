from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("/", response_model=List[schemas.BookResponse])
def get_books(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    available_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(models.Book)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Book.title.ilike(pattern),
                models.Book.author.ilike(pattern),
                models.Book.isbn.ilike(pattern),
            )
        )

    if category and category != "All":
        query = query.filter(models.Book.category == category)

    if available_only:
        query = query.filter(models.Book.available_copies > 0)

    return query.order_by(models.Book.id.desc()).all()


@router.get("/{book_id}", response_model=schemas.BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    return book


@router.post("/", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: schemas.BookCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    existing = db.query(models.Book).filter(models.Book.isbn == book_in.isbn).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A book with this ISBN already exists.",
        )

    new_book = models.Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        category=book_in.category,
        cover_url=book_in.cover_url,
        total_copies=book_in.total_copies,
        available_copies=book_in.total_copies,
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book


@router.put("/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: int,
    book_in: schemas.BookUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    update_data = book_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    active_loans = (
        db.query(models.BorrowLog)
        .filter(
            models.BorrowLog.book_id == book_id,
            models.BorrowLog.status == models.BorrowStatus.ACTIVE,
        )
        .count()
    )
    if active_loans > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a book with active borrowed copies.",
        )

    db.delete(book)
    db.commit()
    return None