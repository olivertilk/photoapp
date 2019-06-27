import React from 'react';
import {
  Typography,
  Button
} from '@material-ui/core';
import './userDetail.css';
import axios from 'axios';

/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: ''
    }
  
    this.handleDeleteUser = this.handleDeleteUser.bind(this);
  }

  componentDidMount() {
    axios.get('/user/' + this.props.match.params.userId).then((response) => {
      this.setState({
        user: response.data
      });
      
      //Must call this handler in the parent to update TopBar context
      this.props.handler(this.state.user.first_name + ' ' + this.state.user.last_name);
    })
    .catch(function (error) {
          console.log(error);
    });
  }

  componentDidUpdate(prevProps) {
    //Only call setState if another user was clicked on
    if (this.props.match.params.userId !== prevProps.match.params.userId) {
      axios.get('/user/' + this.props.match.params.userId).then((response) => {
        this.setState({
          user: response.data
        });

        //Must call this handler in the parent to update TopBar context
        this.props.handler(this.state.user.first_name + ' ' + this.state.user.last_name);
      })
      .catch(function (error) {
          console.log(error);
      });
    }
  }

  handleDeleteUser(event) {
    if (confirm("Are you sure you want to delete your account?")) {
      axios.post('/deleteUser', { user_id: this.props.loggedInUser._id }).then(() => {

        axios.post('/admin/logout', {}).then(() => {
          this.props.logoutHandler();
        })
        .catch( (error) => {
          console.log(error);
        });
      })
      .catch( (error) => {
        console.log(error);
      });

      event.preventDefault();
    }
  }

  isUserDeleteAllowed() {
    if (this.props.match.params.userId === this.props.loggedInUser._id) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    return (
      <div className="cs142-userdetail-container">
        <Typography variant="headline">
          {this.state.user.first_name + " " + this.state.user.last_name} 
          <p />
          <Button variant='outlined' href={"#/photos/" + this.props.match.params.userId} >
            View photos
          </Button>
        </Typography>
        <p />
        <Typography variant="subheading">
          <strong>Location:</strong>{'   '}  {this.state.user.location}
          <br />
          <strong>Occupation:{'   '}</strong>  {this.state.user.occupation}
          <p />
          <strong>Description:</strong>
          <br />
          {this.state.user.description}
        </Typography>
        <p />
        { this.isUserDeleteAllowed() ?
          <span className='cs142-user-delete'>
            <form onSubmit={(event) => this.handleDeleteUser(event)} >
              <Button type='submit' variant='contained' color='secondary' size='small'>
              Delete account
              </Button>
            </form>
          </span>
          :
          ''
        }
      </div>
    );
  }
}

export default UserDetail;
