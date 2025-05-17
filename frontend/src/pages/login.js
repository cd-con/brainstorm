import { Button, Row } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Notify from '../toaster/toaster';
import { useState } from 'react';

function Login(onLogin, on) {
  // Toaster test
  const [isVisible, setVisible] = useState(false);
  return (
    <div className='container d-flex 
         align-items-center 
         justify-content-center 
         min-vh-100 w-50'>

    <Form className='container p-5 bg-light rounded'>
      <Form.Group className='col p-0 m-0' controlId="formTitle">
        <p className='text-muted p-0 m-0'>Добро пожаловать в</p>
        <h2 className='bold p-0'>
        BrainStorm
        </h2>
    </Form.Group>
      <Form.Group className="mb-3" controlId="formPlaintextEmail">
        <Form.Label column sm="2">
          E-mail
        </Form.Label>
        <Col sm="10">
          <Form.Control type='text' placeholder='Электронная почта' />
        </Col>
      </Form.Group>

      <Form.Group className="mb-3" controlId="formPlaintextPassword">
        <Form.Label column sm="2">
          Пароль
        </Form.Label>
        <Col sm="10">
          <Form.Control type="password" placeholder="Пароль" />
        </Col>
      </Form.Group>
      <Button className='mr-5' onClick={() => setVisible(true)}>Войти</Button>
      <Button className='bg-secondary'>Зарегестрироваться</Button>
    </Form>
    {Notify("Test toast", "A crunchy test toast", isVisible, setVisible)}
    </div>
  );
}

function Test(){
}

export default Login;