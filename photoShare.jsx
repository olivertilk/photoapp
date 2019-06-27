import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import LoginRegister from './components/loginRegister/LoginRegister';
import UploadPhoto from './components/uploadPhoto/UploadPhoto';
import Activities from './components/activities/Activities';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      topBarContext: '',
      loggedInUser: ''
    }

    this.handler = this.handler.bind(this);
    this.loginHandler = this.loginHandler.bind(this);
    this.logoutHandler = this.logoutHandler.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
  }

  handler(topBarContext) {
    this.setState({
      topBarContext: topBarContext
    });
  }

  loginHandler(loggedInUser) {
    this.setState({
      loggedInUser: loggedInUser
    });
  }

  logoutHandler() {
    this.setState({
      loggedInUser: ''
    });
  }

  isLoggedIn() {
    if (this.state.loggedInUser) {
      return true;
    }else{
      return false;
    }
  }

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar context={this.state.topBarContext} loggedInUser={this.state.loggedInUser} logoutHandler={this.logoutHandler} isLoggedIn={this.isLoggedIn} />
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper  className="cs142-main-grid-item">
            <UserList isLoggedIn={this.isLoggedIn} />
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item">
            <Switch>
              { this.isLoggedIn() ?
                  <Redirect path="/login-register" to={"/users/" + this.state.loggedInUser._id} />
                :
                  <Route path="/login-register"
                    render ={ props => <LoginRegister {...props} handler={this.handler} loginHandler={this.loginHandler} /> }
                  />
              }
              { this.isLoggedIn() ?
                  <Route path="/users/:userId"
                  render={ props => <UserDetail {...props} handler={this.handler} loggedInUser={this.state.loggedInUser} logoutHandler={this.logoutHandler}/> }
                  />
                :
                  <Redirect path="/users/:userid" to="/login-register" />
              }
              { this.isLoggedIn() ?
                  <Route path="/photos/:userId"
                    render ={ props => <UserPhotos {...props} handler={this.handler} loggedInUser={this.state.loggedInUser}/ > }
                  />
                :
                  <Redirect path="/photos/:userid" to="/login-register" />
              }
              { this.isLoggedIn() ?
                  <Route path="/users" render ={ props => <UserList {...props} handler={this.handler} isLoggedIn={this.isLoggedIn}/> }  />
                :
                  <Redirect path="/users" to="/login-register" />
              }
              { this.isLoggedIn() ?
                  <Route path="/uploadPhoto" render ={ props => <UploadPhoto {...props} handler={this.handler} /> }  />
                :
                  <Redirect path="/uploadPhoto" to="/login-register" />
              }
              { this.isLoggedIn() ?
                  <Route path="/activities" render ={ props => <Activities {...props} handler={this.handler} /> }  />
                :
                  <Redirect path="/activities" to="/login-register" />
              }
              {
                this.isLoggedIn() ?
                  <Redirect path="/" to={"/users/" + this.state.loggedInUser._id} />
                :
                  <Redirect path="/" to="/login-register" />
              }
              
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
    </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
