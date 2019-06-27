import React from 'react';
import {
  Typography,
  TextField,
  Button,
}
from '@material-ui/core';
import './loginRegister.css';
import axios from 'axios';

/**
 * Define UserList, a React componment of CS142 project #5
 */
class LoginRegister extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedInUser: '',
      login_name: '',
      login_password: '',
      register_login_name: '',
      register_password: '',
      register_password2: '',
      register_first_name: '',
      register_last_name: '',
      register_location: '',
      register_description: '',
      register_occupation: '',
      loginResponse: '',
      registerResponse: ''
    }
    
    this.handleSubmitLogin = this.handleSubmitLogin.bind(this);
    this.handleSubmitRegister = this.handleSubmitRegister.bind(this);
  }

  handleSubmitLogin(event) {
    axios.post('/admin/login', { login_name: this.state.login_name, password: this.state.login_password })
      .then( (response) => {
        this.setState({
          loggedInUser: response.data
        });

        this.props.loginHandler(this.state.loggedInUser);
      })
      .catch( (error) => {
          this.setState({
            loginResponse: error.response.data
          });
      });

    event.preventDefault();

    //Must call this handler in the parent to update TopBar context
    //if(typeof this.props.handler !== 'undefined'){
    //this.props.loginHandler(this.state.loggedInUserId);
  }

  handleSubmitRegister(event) {
    if (this.state.register_password !== this.state.register_password2) {
      this.setState({
        registerResponse: 'Password fields must match.'
      });
      return;
    }

    let registration = {
      login_name: this.state.register_login_name,
      password: this.state.register_password,
      first_name: this.state.register_first_name,
      last_name: this.state.register_last_name,
      location: this.state.register_location,
      description: this.state.register_description,
      occupation: this.state.register_occupation
    }

    axios.post('/user', registration)
      .then( (response) => {
        //If registration was sucessful, set the fields to blank
        this.setState({
          registerResponse: response.data,
          register_login_name: '',
          register_password: '',
          register_password2: '',
          register_first_name: '',
          register_last_name: '',
          register_location: '',
          register_occupation: '',
          register_description: ''
        });
      })
      .catch( (error) => {
        this.setState({
          registerResponse: error.response.data
        });
      });

    event.preventDefault();
  }

  handleLoginName = (event) => {
    this.setState({ login_name: event.target.value });
  }

  handleLoginPassword = (event) => {
    this.setState({ login_password: event.target.value });
  }

  handleRegisterLoginName = (event) => {
    this.setState({ register_login_name: event.target.value });
  }

  handleRegisterPassword = (event) => {
    this.setState({ register_password: event.target.value });
  }

  handleRegisterPassword2 = (event) => {
    this.setState({ register_password2: event.target.value });
  }

  handleRegisterFirstName = (event) => {
    this.setState({ register_first_name: event.target.value });
  }

  handleRegisterLastName = (event) => {
    this.setState({ register_last_name: event.target.value });
  }

  handleRegisterLocation = (event) => {
    this.setState({ register_location: event.target.value });
  }

  handleRegisterDescription = (event) => {
    this.setState({ register_description: event.target.value });
  }

  handleRegisterOccupation = (event) => {
    this.setState({ register_occupation: event.target.value });
  }

  render() {
    return (
      <div className="cs142-login-form">
        <Typography variant="headline">
          <center>Log in:</center>
          <p />
        </Typography>
        <form onSubmit={this.handleSubmitLogin}>
          <TextField id='login_name' label='Login name' value={this.state.login_name} onChange={this.handleLoginName} />
          <p />
          <TextField type='password' id='login_password' label='Password' value={this.state.login_password} onChange={this.handleLoginPassword} />
          <Typography variant="subtitle1" color='secondary'>
            {this.state.loginResponse}
          </Typography>
          <p />
          <Button type='submit' variant='contained' color='primary'>
          Log me in
          </Button>
        </form>
        <br />
        <br />
        <Typography variant="headline">
          <center>Register:</center>
          <p />
        </Typography>
        <form onSubmit={this.handleSubmitRegister}>
          <TextField id='register_login_name' label='Login name' value={this.state.register_login_name} onChange={this.handleRegisterLoginName} />
          <p />
          <TextField type='password' id='register_password' label='Password' value={this.state.register_password} onChange={this.handleRegisterPassword} />
          <p />
          <TextField type='password' id='register_password2' label='Password' value={this.state.register_password2} onChange={this.handleRegisterPassword2} />
          <p />
          <TextField id='register_first_name' label='First name' style={{ margin: 8 }} value={this.state.register_first_name} onChange={this.handleRegisterFirstName} />
          <TextField id='register_last_name' label='Last name' style={{ margin: 8 }} value={this.state.register_last_name} onChange={this.handleRegisterLastName} />
          <p />
          <TextField id='register_location' label='Location' style={{ margin: 8 }} value={this.state.register_location} onChange={this.handleRegisterLocation} />
          <TextField id='register_occupation' label='Occupation' style={{ margin: 8 }} value={this.state.register_occupation} onChange={this.handleRegisterOccupation} />
          <p />
          <TextField fullWidth multiline id='register_description' label='Description' variant='outlined' value={this.state.register_description} onChange={this.handleRegisterDescription} />
          <Typography variant="subtitle1" color='secondary'>
          {this.state.registerResponse}
          </Typography>
          <p />
          <Button type='submit' variant='contained' color='primary'>
          Register Me
          </Button>
        </form>
      </div>
    );
  }
}

export default LoginRegister;


