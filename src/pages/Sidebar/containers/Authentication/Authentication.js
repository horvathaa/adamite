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

  const signInGoogleClickedHandler = e => {
    e.preventDefault();
    chrome.runtime.sendMessage(
      {
        msg: 'USER_SIGNINGOOGLE',
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
      <div className="InputFieldContainer row">
        <div className="Header">
          <h3>Login</h3> <hr />
        </div>
      </div>
      <div className="InputFieldContainer row">
        <input
          type="email"
          value={email}
          placeholder="email"
          onChange={e => {
            setEmail(e.target.value);
          }}
        />
      </div>
      <div className="InputFieldContainer row">
        <input
          type="password"
          value={password}
          placeholder="password"
          onChange={e => {
            setPassword(e.target.value);
          }}
        />
      </div>
      <div className="InputFieldContainer row">
        <button onClick={signUpClickedHandler}><div>Sign up</div></button>
        <button onClick={signInClickedHandler}><div>Sign in</div></button>
        <button onClick={signInGoogleClickedHandler}><div>Sign in Google</div></button>
        
        
        {/* <button onClick={forgetPwdClickedHandler}><div>Forget pwd</div></button> */}
      </div>
      <div className="InputFieldContainer row" >
        <div className="Forgotten" onClick={forgetPwdClickedHandler}>Forgot Password?</div>
      </div>
    </div>
  );
};

export default Authentication;
