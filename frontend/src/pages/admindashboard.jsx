import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  Tabs,
  Tab,
  Spinner,
} from 'react-bootstrap';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_titles: 0,
    total_copies: 0,
    active_loans: 0,
    overdue_loans: 0,
    total_members: 0,
  });
  const [books, setBooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [showModal, setShowModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    cover_url: '',
    total_copies: 3,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, booksRes, logsRes] = await Promise.all([
        api.get('/borrow/admin/stats'),
        api.get('/books/'),
        api.get('/borrow/admin/all-logs'),
      ]);
      setStats(statsRes.data);
      setBooks(booksRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load admin dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books/', {
        ...newBook,
        total_copies: Number(newBook.total_copies),
        cover_url: newBook.cover_url.trim() || null,
      });
      setShowModal(false);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        category: 'Computer Science',
        cover_url: '',
        total_copies: 3,
      });
      setFeedback({ type: 'success', message: 'New book added to catalog.' });
      fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.detail || 'Failed to add book.',
      });
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await api.delete(`/books/${bookId}`);
      setFeedback({ type: 'success', message: 'Book removed from inventory.' });
      fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.detail || 'Cannot delete book.',
      });
    }
  };

  const handleForceReturn = async (logId) => {
    try {
      await api.post(`/borrow/return/${logId}`);
      setFeedback({ type: 'success', message: 'Book marked as returned.' });
      fetchDashboardData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.detail || 'Failed to return book.',
      });
    }
  };

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Librarian Admin Dashboard</h2>
          <p className="text-muted small mb-0">Inventory management, active circulation, and overdue monitoring</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>Add New Book
        </Button>
      </div>

      {feedback.message && (
        <Alert
          variant={feedback.type}
          dismissible
          onClose={() => setFeedback({ type: '', message: '' })}
        >
          {feedback.message}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="card-elevated border-start border-4 border-primary">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold">Total Books</div>
              <div className="fs-3 fw-bold mt-1">{stats.total_copies}</div>
              <div className="text-muted small">{stats.total_titles} unique titles</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="card-elevated border-start border-4 border-success">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold">Active Loans</div>
              <div className="fs-3 fw-bold mt-1">{stats.active_loans}</div>
              <div className="text-muted small">Currently checked out</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="card-elevated border-start border-4 border-danger">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold">Overdue Items</div>
              <div className="fs-3 fw-bold text-danger mt-1">{stats.overdue_loans}</div>
              <div className="text-muted small">Past 14-day return window</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="card-elevated border-start border-4 border-info">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold">Registered Members</div>
              <div className="fs-3 fw-bold mt-1">{stats.total_members}</div>
              <div className="text-muted small">Active student accounts</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="card-elevated">
          <Card.Body>
            <Tabs defaultActiveKey="inventory" className="mb-3">
              <Tab eventKey="inventory" title={`Book Inventory (${books.length})`}>
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Title & Author</th>
                      <th>Category</th>
                      <th>ISBN</th>
                      <th>Stock</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((b) => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>
                          <div className="fw-semibold">{b.title}</div>
                          <div className="text-muted small">{b.author}</div>
                        </td>
                        <td>
                          <Badge bg="secondary">{b.category}</Badge>
                        </td>
                        <td className="small">{b.isbn}</td>
                        <td>
                          <Badge bg={b.available_copies > 0 ? 'success' : 'danger'}>
                            {b.available_copies} / {b.total_copies}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteBook(b.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="logs" title={`Circulation Logs (${logs.length})`}>
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Member</th>
                      <th>Book</th>
                      <th>Borrowed</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="fw-semibold">{log.user?.full_name}</div>
                          <div className="text-muted small">{log.user?.email}</div>
                        </td>
                        <td>{log.book?.title}</td>
                        <td>{formatDate(log.borrow_date)}</td>
                        <td>{formatDate(log.due_date)}</td>
                        <td>
                          <Badge
                            bg={log.status === 'Active' ? 'warning' : 'secondary'}
                            text={log.status === 'Active' ? 'dark' : 'light'}
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {log.status === 'Active' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleForceReturn(log.id)}
                            >
                              Mark Returned
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleAddBook}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Add New Book to Catalog</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Book Title</Form.Label>
              <Form.Control
                type="text"
                required
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Author</Form.Label>
              <Form.Control
                type="text"
                required
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ISBN</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Copies</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    required
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
                <option value="General">General</option>
                <option value="Fiction">Fiction</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Cover Image URL (Optional)</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://..."
                value={newBook.cover_url}
                onChange={(e) => setNewBook({ ...newBook, cover_url: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Book
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;