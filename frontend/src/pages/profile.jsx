import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';

const Profile = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/borrow/my-books');
      setLogs(response.data);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load your borrowing history.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const handleReturn = async (logId) => {
    setFeedback({ type: '', message: '' });
    try {
      await api.post(`/borrow/return/${logId}`);
      setFeedback({ type: 'success', message: 'Book returned successfully!' });
      fetchMyBooks();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.detail || 'Failed to return book.',
      });
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (log) => {
    return log.status === 'Active' && new Date(log.due_date) < new Date();
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Borrowed Books</h2>
          <p className="text-muted small mb-0">
            Track active loans, due dates, and return history (Max 3 active books).
          </p>
        </div>
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

      <Card className="card-elevated">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bookmark-check fs-1 text-muted"></i>
              <h5 className="mt-3">No borrowing activity yet</h5>
              <p className="text-muted mb-0">Visit the catalog to borrow your first book.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Book Title</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="ps-4">
                      <div className="fw-semibold">{log.book?.title || `Book #${log.book_id}`}</div>
                      <div className="text-muted small">{log.book?.author}</div>
                    </td>
                    <td>{formatDate(log.borrow_date)}</td>
                    <td className={isOverdue(log) ? 'text-danger fw-bold' : ''}>
                      {formatDate(log.due_date)}
                    </td>
                    <td>
                      {log.status === 'Returned' ? (
                        <Badge bg="secondary">Returned ({formatDate(log.return_date)})</Badge>
                      ) : isOverdue(log) ? (
                        <Badge bg="danger">Overdue</Badge>
                      ) : (
                        <Badge bg="success">Active</Badge>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      {log.status === 'Active' ? (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleReturn(log.id)}
                        >
                          Return Book
                        </Button>
                      ) : (
                        <span className="text-muted small">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;