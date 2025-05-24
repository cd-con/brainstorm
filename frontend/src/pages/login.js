import { Button, Col, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import ProviderHTTP from '../providers/ProviderHTTP';

const Login = () => {
  const nav = useNavigate();
  const provider = new ProviderHTTP()

  const login = async e => {
    e.preventDefault();
    const [email, pass] = [e.target.form[0].value, e.target.form[1].value];
    if (await provider.login({ email, password: pass })) {
      window.addNotification({ title: 'Login', message: 'Success!', variant: 'info', delay: 10000 });
      nav('/you');
    } else {
      window.addNotification({ title: 'Login', message: 'Invalid credentials!', variant: 'warning', delay: 3000 });
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 w-75">
      <Form className="container p-5 bg-light rounded">
        <Form.Group className="col p-0 m-0" controlId="formTitle">
          <p className="text-muted p-0 m-0">Welcome to</p>
          <h2 className="bold p-0">BrainStorm</h2>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label column sm="2">E-mail</Form.Label>
          <Col sm="10"><Form.Control type="text" placeholder="Email" /></Col>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label column sm="2">Password</Form.Label>
          <Col sm="10"><Form.Control type="password" placeholder="Password" /></Col>
        </Form.Group>
        <Button type="button" className="me-2" onClick={login}>Login</Button>
        <Button type="button" className="ms-2 bg-secondary" onClick={() => nav('register')}>Register</Button>
      </Form>
    </div>
  );
};

export default Login;