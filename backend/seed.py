from app.database import SessionLocal, engine, Base
from app import models, auth

Base.metadata.create_all(bind=engine)

SAMPLE_BOOKS = [
    {
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "isbn": "978-1449373320",
        "category": "Computer Science",
        "total_copies": 4,
    },
    {
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "category": "Computer Science",
        "total_copies": 5,
    },
    {
        "title": "Introduction to Algorithms (CLRS)",
        "author": "Thomas H. Cormen",
        "isbn": "978-0262046305",
        "category": "Computer Science",
        "total_copies": 3,
    },
    {
        "title": "Operating System Concepts",
        "author": "Abraham Silberschatz",
        "isbn": "978-1119800361",
        "category": "Engineering",
        "total_copies": 4,
    },
    {
        "title": "Database System Concepts",
        "author": "Henry F. Korth",
        "isbn": "978-0078022159",
        "category": "Computer Science",
        "total_copies": 3,
    },
    {
        "title": "The Intelligent Investor",
        "author": "Benjamin Graham",
        "isbn": "978-0060555665",
        "category": "Finance",
        "total_copies": 2,
    },
    {
        "title": "Deep Learning",
        "author": "Ian Goodfellow",
        "isbn": "978-0262035613",
        "category": "Computer Science",
        "total_copies": 3,
    },
    {
        "title": "The Pragmatic Programmer",
        "author": "Andrew Hunt & David Thomas",
        "isbn": "978-0135957059",
        "category": "Engineering",
        "total_copies": 4,
    },
]


def seed_database():
    db = SessionLocal()
    try:
        added = 0
        for item in SAMPLE_BOOKS:
            exists = db.query(models.Book).filter(models.Book.isbn == item["isbn"]).first()
            if not exists:
                book = models.Book(
                    title=item["title"],
                    author=item["author"],
                    isbn=item["isbn"],
                    category=item["category"],
                    total_copies=item["total_copies"],
                    available_copies=item["total_copies"],
                )
                db.add(book)
                added += 1

        demo_member = db.query(models.User).filter(models.User.email == "student@athena.edu").first()
        if not demo_member:
            db.add(
                models.User(
                    full_name="Aarav Sharma",
                    email="student@athena.edu",
                    hashed_password=auth.get_password_hash("Student@123"),
                    role=models.UserRole.MEMBER,
                )
            )

        db.commit()
        print(f"Seeded {added} books.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()