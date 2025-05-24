import { Button, Col, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import ProviderHTTP from '../providers/ProviderHTTP';

function Register() {
  const navigate = useNavigate();
  const provider = new ProviderHTTP();

  const onRegisterClick = async (e) => {
    e.preventDefault();
    const email = e.target.form[0].value;
    const password = e.target.form[1].value;
    const username = e.target.form[2].value;

    if (await provider.register({ email, password, username })) {
      window.addNotification({
        title: 'Регистрация',
        message: 'Аккаунт успешно создан!',
        variant: 'success',
        delay: 10000,
      });
      navigate('/you');
    } else {
      window.addNotification({
        title: 'Регистрация',
        message: 'Не удалось создать аккаунт. Проверьте данные и попробуйте снова.',
        variant: 'warning',
        delay: 3000,
      });
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 w-75">
      <Form className="container p-5 bg-light rounded">
        <Form.Group className="col p-0 m-0" controlId="formTitle">
          <p className="text-muted p-0 m-0">Создайте аккаунт в</p>
          <h2 className="bold p-0">BrainStorm</h2>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label column sm="2">E-mail</Form.Label>
          <Col sm="10">
            <Form.Control type="email" placeholder="Электронная почта" />
          </Col>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label column sm="2">Пароль</Form.Label>
          <Col sm="10">
            <Form.Control type="password" placeholder="Пароль" />
          </Col>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formUsername">
          <Form.Label column sm="2">Имя пользователя</Form.Label>
          <Col sm="10">
            <Form.Control type="text" placeholder="Имя пользователя" />
          </Col>
        </Form.Group>
        <Button type="button" className="me-2" onClick={onRegisterClick}>
          Зарегистрироваться
        </Button>
        <Button
          type="button"
          className="ms-2 bg-secondary"
          onClick={() => navigate('/')}
        >
          Войти
        </Button>
      </Form>
    </div>
  );
}

export default Register;