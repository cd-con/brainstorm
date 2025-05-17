import { Button, Col, Form } from 'react-bootstrap';
import { useNavigate } from "react-router";
import LoginProvider from '../providers/Debug';

function Login() {
  const navigate = useNavigate();
  const provider = new LoginProvider();

  const onLoginClick = async (e) => {
    e.preventDefault();
    const email = e.target.form[0].value;
    const password = e.target.form[1].value;
    if (await provider.login({ email, password })) {
      window.addNotification({
        title: 'Вход',
        message: 'Вы успешно вошли в аккаунт!',
        variant: 'info',
        delay: 10000
      });
      navigate('/you'); // Redirect to dashboard on success
    } else {
      window.addNotification({
        title: 'Вход',
        message: 'Неверный E-mail или пароль!',
        variant: 'warning',
        delay: 3000
      });
    }
  };

  return (
    <div className='container d-flex align-items-center justify-content-center min-vh-100 w-75'>
      <Form className='container p-5 bg-light rounded'>
        <Form.Group className='col p-0 m-0' controlId="formTitle">
          <p className='text-muted p-0 m-0'>Добро пожаловать в</p>
          <h2 className='bold p-0'>BrainStorm</h2>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label column sm="2">E-mail</Form.Label>
          <Col sm="10">
            <Form.Control type='text' placeholder='Электронная почта' />
          </Col>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label column sm="2">Пароль</Form.Label>
          <Col sm="10">
            <Form.Control type="password" placeholder="Пароль" />
          </Col>
        </Form.Group>
        <Button type='button' className='me-2' onClick={onLoginClick}>Войти</Button>
        <Button type='button' className='ms-2 bg-secondary'>Зарегистрироваться</Button>
      </Form>
    </div>
  );
}

export default Login;