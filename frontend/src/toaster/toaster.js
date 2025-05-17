import { useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

export class Toaster{
    constructor(){
       this.pendingToast = []
    }
    Notify(title, content, isVisible, setVisible) {
        this.pendingToast.push(
          <>
            <Toast className='' show={isVisible} onClose={() => setVisible(false)}>
              <Toast.Header>
                <strong className="mr-auto">{title}</strong>
              </Toast.Header>
              <Toast.Body>{content}</Toast.Body>
            </Toast>
          </>
        );
      };

      GetPendingToasts(){
        return (
        <ToastContainer className="position-static">
          {this.pendingToast.forEach((toast) => {return toast})}
        </ToastContainer>
        )
    }
}


