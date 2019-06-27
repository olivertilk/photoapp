import React from 'react';
import {
  AppBar, Toolbar, Typography, Button
} from '@material-ui/core';
import {
  HashRouter, Route
} from 'react-router-dom';
import './TopBar.css';
import axios from 'axios';

/**
 * Define TopBar, a React componment of CS142 project #5
 * TopBar is not routed to and therefore doesn't have a props.match property to grab user ID from
 */

class TopBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      version: ''
    }

    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    axios.get('/test/info').then((response) => {
      this.setState({
        version: response.data.__v
      });
    });
  }

  handleLogout(event) {
    axios.post('/admin/logout', {}).then(() => {
      this.props.logoutHandler();
    });

    event.preventDefault();
  }

  render() {
    return (
      <HashRouter>
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Typography variant="h5" color="inherit">
            <div className="cs142-topbar-container">
              <div>
                Version: {this.state.version} by Oliver Tilk. 
                {this.props.isLoggedIn() ? 
                  <span> Hi {this.props.loggedInUser.first_name}! 
                  <form onSubmit={this.handleLogout} className="cs142-topbar-logout">
                    <Button variant='contained' color='default' href="#/uploadPhoto" >
                    Upload photo
                    </Button>
                    <Button variant='contained' color='default' href="#/activities" >
                    Activities
                    </Button>
                    <Button type='submit' variant='contained' color='default'>
                    Log out
                    </Button>
                  </form>
                  </span>
                  : 
                    ' Please Login '
                }
              </div>
              <Route path="/users"
                  render={ () => {
                    return (<div className="cs142-topbar-context">{this.props.context}</div>);
                    }
                  }
              />
              <Route path="/users/:userId"
                  render={ () => {
                    return (<div className="cs142-topbar-context">{this.props.context}</div>);
                    }
                  }
              />
              <Route path="/photos/:userId"
                  render={ () => {
                    return (<div className="cs142-topbar-context">Photos of {this.props.context}</div>);
                    }
                  }
              />
              <Route path="/uploadPhoto"
                  render={ () => {
                    return (<div className="cs142-topbar-context">Upload photo</div>);
                    }
                  }
              />
              <Route path="/activities"
                  render={ () => {
                    return (<div className="cs142-topbar-context">{this.props.context}</div>);
                    }
                  }
              />
            </div>
          </Typography>
        </Toolbar>
      </AppBar>
      </HashRouter>
    );
  }
}

export default TopBar;
