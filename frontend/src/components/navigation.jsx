import React from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar expand="lg" variant="dark" className="navbar-enterprise sticky-top py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center gap-2">
          <i className="bi bi-book-half fs-4"></i>
          <span>Athena Library</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Catalog</Nav.Link>
            {user && user.role === 'Member' && (
              <Nav.Link as={Link} to="/my-books">My Borrowed Books</Nav.Link>
            )}
            {user && user.role === 'Admin' && (
              <Nav.Link as={Link} to="/admin">Admin Dashboard</Nav.Link>
            )}
          </Nav>

          <Nav className="align-items-center gap-2">
            {user ? (
              <>
                <span className="text-light small me-2">
                  {user.fullName}{' '}
                  <Badge bg={user.role === 'Admin' ? 'warning' : 'info'} text="dark">
                    {user.role}
                  </Badge>
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline-light" size="sm">
                  Login
                </Button>
                <Button as={Link} to="/register" variant="light" size="sm">
                  Register
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;