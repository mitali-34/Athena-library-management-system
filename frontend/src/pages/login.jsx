import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === 'Admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="card-elevated p-4" style={{ width: '100%', maxWidth: '420px' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock fs-1 text-primary"></i>
            <h3 className="fw-bold mt-2">Welcome Back</h3>
            <p className="text-muted small">Sign in to access the library portal</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 py-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <div className="text-center mt-3 small">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;