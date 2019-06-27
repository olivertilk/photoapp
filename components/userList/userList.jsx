import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
}
from '@material-ui/core';
import './userList.css';
import axios from 'axios';

/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      users: []
    }
  }

  componentDidMount() {
    //Only retrieve the user list if the user is logged in upon page load
    if (this.props.isLoggedIn()) {
      axios.get('/user/list')
        .then((response) => {
          this.setState({
            users: response.data
          });
        })
        .catch(function (error) {
          console.log(error);
        });

      //Must call this handler in the parent to update TopBar context
      if(typeof this.props.handler === 'function'){
        this.props.handler('User List');
      }
    }
  }

  componentDidUpdate() {
    //This is the case where the user has just logged in
    if (this.props.isLoggedIn() && this.state.users.length === 0) {
      axios.get('/user/list')
        .then((response) => {
          this.setState({
            users: response.data
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    } 

    //This is the case where the user has just logged out
    if (!this.props.isLoggedIn() && this.state.users.length > 0) {
      this.setState({
        users: []
      });
    }
  }

  render() {
    let listItems = [];
    for (let i = 0; i < this.state.users.length; i++) {
      listItems.push(
        <div key={i}>
          <ListItem button component="a" href={"#/users/" + this.state.users[i]._id}>
            <ListItemText primary={this.state.users[i].first_name + " " + this.state.users[i].last_name} />
          </ListItem>
          <Divider />
        </div>
      );
    }
    return (
      <div className="cs142-userlist-container">
        <Typography variant="headline">
          <center>Users:</center>
          <p />
        </Typography>
        <List component="nav">
          <Divider />
          {listItems}
        </List>
      </div>
    );
  }
}

export default UserList;
