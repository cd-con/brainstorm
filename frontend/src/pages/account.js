import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container, Row, Col, Card, Button, ListGroup, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginProvider from '../providers/auth/Debug.js'; // Adjust path as needed

const UserProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const provider = new LoginProvider();
    provider
      .getUserProfile()
      .then((profileData) => {
        setUserData(profileData);
        setRooms(profileData.rooms || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load user profile');
        setLoading(false);
      });
  }, []);

  const handleJoinRoom = (roomId) => {
    navigate(`/canvas/${roomId}`);
  };

  const handleCreateRoom = async () => {
  if (newRoomName.trim()) {
    try {
      const provider = new LoginProvider();
      const response = await fetch('http://localhost:6942/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.getToken()}`,
        },
        body: JSON.stringify({ name: newRoomName }),
      });
      if (!response.ok) throw new Error('Failed to create room');
      const newRoom = await response.json();
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
      setShowCreateModal(false);
    } catch (error) {
      window.addNotification({
        title: 'Error',
        message: 'Failed to create room',
        variant: 'warning',
        delay: 3000
      });
    }
  }
};

const handleDeleteRoom = async (roomId) => {
  try {
    const provider = new LoginProvider();
    const response = await fetch(`http://localhost:6942/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${provider.getToken()}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete room');
    setRooms(rooms.filter((room) => room.id !== roomId));
    setShowDeleteModal(false);
    setRoomToDelete(null);
  } catch (error) {
    window.addNotification({
      title: 'Error',
      message: 'Failed to delete room',
      variant: 'warning',
      delay: 3000
    });
  }
};

  const handleShowDeleteModal = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleLogout = async () => {
    try {
      const provider = new LoginProvider();
      await provider.logout();
      setUserData(null);
      setRooms([]);
      navigate('/'); // Redirect to login page after logout
    } catch (err) {
      window.addNotification({
        title: 'Выход',
        message: 'Не удалось выйти из аккаунта.\n\nВы теперь здесь навсегда.',
        variant: 'warning',
        delay: 3000
      });
    }
  };

  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body className="text-center">
              <img
                src={userData?.ppic}
                alt=""
                className="rounded-circle mb-3 bg-secondary"
                style={{ width: '128px', height: '128px' }}
                onError={(e) => (e.target.src = '')}
              />
              <Card.Title>{userData?.username}</Card.Title>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="mb-3 me-2"
              >
                Create Room
              </Button>
              <Button variant="outline-danger" onClick={handleLogout} className="mb-3">
                Logout
              </Button>
              <ListGroup variant="flush">
                {rooms.map((room) => (
                  <ListGroup.Item key={room.id} className="d-flex justify-content-between align-items-center">
                    <span>{room.name}</span>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                        className="me-2"
                      >
                        Join
                      </Button>
                      {room.isOwner && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(room)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Room Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="roomName">
              <Form.Label>Room Name</Form.Label>
              <Form.Control
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Room Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the room "{roomToDelete?.name}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteRoom(roomToDelete?.id)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;