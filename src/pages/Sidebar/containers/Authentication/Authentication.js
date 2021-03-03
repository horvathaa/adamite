import React, { useState } from 'react';
import * as EmailValidator from 'email-validator';
import './Authentication.css';

const Authentication = props => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUpClickedHandler = e => {
    e.preventDefault();
    if (!EmailValidator.validate(email)) {
      // invalid email;
      alert('Invalid email!');
      return;
    }
    if (password.length < 6) {
      // password too short
      alert('Password too short!');
      return;
    }
    chrome.runtime.sendMessage(
      {
        msg: 'USER_SIGNUP',
        payload: {
          email,
          password,
        },
      },
      response => {
        console.log(response);
        if (response !== undefined && response.error) {
          alert(response.message);
        }
      }
    );
  };

  const signInClickedHandler = e => {
    e.preventDefault();
    if (!EmailValidator.validate(email)) {
      // invalid email;
      alert('Invalid email!');
      return;
    }
    if (password.length < 6) {
      // password too short
      alert('Password too short!');
      return;
    }
    chrome.runtime.sendMessage(
      {
        msg: 'USER_SIGNIN',
        payload: {
          email,
          password,
        },
      },
      response => {
        console.log(response);
        if (response !== undefined && response.error) {
          alert(response.message);
        }
      }
    );
  };

  const forgetPwdClickedHandler = e => {
    e.preventDefault();
    if (!EmailValidator.validate(email)) {
      // invalid email;
      alert('Invalid email!');
      return;
    }
    chrome.runtime.sendMessage(
      {
        msg: 'USER_FORGET_PWD',
        payload: {
          email,
        },
      },
      response => {
        console.log(response);
        if (response !== undefined && response.error) {
          alert(response.message);
        } else {
          alert('Password reset email sent!');
        }
      }
    );
  };

  return (
    <div className="AuthContainer">
      <div className="InputFieldContainer">
        Email:{' '}
        <input
          type="email"
          value={email}
          placeholder="abc@gmail.com"
          onChange={e => {
            setEmail(e.target.value);
          }}
        />
      </div>
      <div className="InputFieldContainer">
        Password:
        <input
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
          }}
        />
      </div>
      <div className="InputFieldContainer">
        <button onClick={signUpClickedHandler}>Sign up</button>
        <button onClick={signInClickedHandler}>Sign in</button>
        <button onClick={forgetPwdClickedHandler}>Forget pwd</button>
      </div>
    </div>
  );
};

export default Authentication;
