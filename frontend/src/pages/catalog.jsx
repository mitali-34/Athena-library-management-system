import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Catalog = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (availableOnly) params.available_only = true;

      const response = await api.get('/books/', { params });
      setBooks(response.data);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load library catalog.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [category, availableOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleBorrow = async (bookId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFeedback({ type: '', message: '' });
    try {
      await api.post(`/borrow/${bookId}`);
      setFeedback({
        type: 'success',
        message: 'Book borrowed successfully! Due in 14 days. Check "My Borrowed Books" to manage returns.',
      });
      fetchBooks();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.detail || 'Unable to borrow this book.',
      });
    }
  };

  return (
    <>
      {/* Enterprise Hero Search Banner */}
      <div className="py-5 mb-4 text-white" style={{ backgroundColor: '#1a365d' }}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="fw-bold mb-2">Explore the Digital Collection</h1>
              <p className="text-light opacity-75 mb-4">
                Search across academic titles, technical references, and general literature.
              </p>

              <Form onSubmit={handleSearchSubmit}>
                <InputGroup size="lg" className="shadow-sm">
                  <Form.Control
                    type="text"
                    placeholder="Search by book title, author, or ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="warning" type="submit" className="fw-semibold px-4">
                    <i className="bi bi-search me-2"></i>Search
                  </Button>
                </InputGroup>
              </Form>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="pb-5">
        {feedback.message && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: '', message: '' })}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Filter Toolbar */}
        <Row className="align-items-center mb-4 g-3">
          <Col md={4}>
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Finance">Finance</option>
              <option value="Fiction">Fiction</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Check
              type="switch"
              id="available-switch"
              label="Show Available Copies Only"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
          </Col>
          <Col md={4} className="text-md-end text-muted small">
            Showing <strong>{books.length}</strong> {books.length === 1 ? 'title' : 'titles'}
          </Col>
        </Row>

        {/* Book Grid */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : books.length === 0 ? (
          <Card className="card-elevated text-center p-5">
            <Card.Body>
              <i className="bi bi-journal-x fs-1 text-muted"></i>
              <h5 className="mt-3">No books found</h5>
              <p className="text-muted mb-0">Try adjusting your search query or filters.</p>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {books.map((book) => (
              <Col key={book.id} sm={6} md={4} lg={3}>
                <Card className="card-elevated h-100 d-flex flex-column">
                  <div
                    className="d-flex align-items-center justify-content-center bg-light border-bottom"
                    style={{ height: '180px', overflow: 'hidden' }}
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-book text-secondary" style={{ fontSize: '3.5rem' }}></i>
                    )}
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Badge bg="secondary" className="fw-normal">
                        {book.category}
                      </Badge>
                      {book.available_copies > 0 ? (
                        <Badge bg="success">{book.available_copies} Available</Badge>
                      ) : (
                        <Badge bg="danger">Out of Stock</Badge>
                      )}
                    </div>

                    <Card.Title className="fs-6 fw-bold mb-1">{book.title}</Card.Title>
                    <Card.Subtitle className="text-muted small mb-2">{book.author}</Card.Subtitle>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      ISBN: {book.isbn}
                    </div>

                    <div className="mt-auto pt-3">
                      <Button
                        variant={book.available_copies > 0 ? 'primary' : 'outline-secondary'}
                        size="sm"
                        className="w-100"
                        disabled={book.available_copies === 0 || user?.role === 'Admin'}
                        onClick={() => handleBorrow(book.id)}
                      >
                        {user?.role === 'Admin'
                          ? 'Admin View Only'
                          : book.available_copies > 0
                          ? 'Borrow Book'
                          : 'Unavailable'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default Catalog;