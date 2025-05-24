import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Container, Row, Col, Card, Button, ListGroup, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import ProviderHTTP from '../providers/ProviderHTTP';

const UserProfile = () => {
  const nav = useNavigate();
  const provider = new ProviderHTTP()
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (user === null){
      provider
        .getUserProfile()
        .then(data => {
          setUser(data);
          setRooms(data.rooms || []);
          setLoad(false);
        })
        .catch(() => {
          setErr('Failed to load profile');
          setLoad(false);
        });
    }
  }, [provider]);

  const joinRoom = id => nav(`/${id}`);

  const createRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const newRoom = await provider.createRoom(roomName);
      setRooms([...rooms, newRoom]);
      setRoomName('');
      setShowCreate(false);
    } catch {
      window.addNotification({ title: 'Error', message: 'Failed to create room', variant: 'warning', delay: 3000 });
    }
  };

  const onRoomDelete = async id => {
    try {
      await provider.deleteRoom(id);
      setRooms(rooms.filter(r => r.id !== id));
      setShowDelete(false);
      setDeleteRoom(null);
    } catch {
      window.addNotification({ title: 'Error', message: 'Failed to delete room', variant: 'warning', delay: 3000 });
    }
  };

  const logout = async () => {
    try {
      await provider.logout();
      setUser(null);
      setRooms([]);
      nav('/');
    } catch {
      window.addNotification({ title: 'Logout', message: 'Failed to logout', variant: 'warning', delay: 3000 });
    }
  };

  if (load) return <Container className="my-4 text-center"><Spinner animation="border" variant="primary" /></Container>;
  if (err) return <Container className="my-4"><Alert variant="danger">{err}</Alert></Container>;

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body className="text-center">
              <img src={user?.ppic} alt="" className="rounded-circle mb-3 bg-secondary" style={{ width: '128px', height: '128px' }} onError={e => (e.target.src = '')} />
              <Card.Title>{user?.username}</Card.Title>
              <Button variant="primary" onClick={() => setShowCreate(true)} className="mb-3 me-2">Create Room</Button>
              <Button variant="outline-danger" onClick={logout} className="mb-3">Logout</Button>
              <ListGroup variant="flush">
                {rooms.map(r => (
                  <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                    <span>{r.name}</span>
                    <div>
                      <Button variant="outline-primary" size="sm" onClick={() => joinRoom(r.id)} className="me-2">Join</Button>
                      {r.isOwner && <Button variant="outline-danger" size="sm" onClick={() => { setDeleteRoom(r); setShowDelete(true); }}>Delete</Button>}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton><Modal.Title>Create Room</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="roomName">
              <Form.Label>Room Name</Form.Label>
              <Form.Control type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Enter room name" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" onClick={createRoom} disabled={!roomName.trim()}>Create</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Delete "{deleteRoom?.name}"?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => onRoomDelete(deleteRoom?.id)}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;