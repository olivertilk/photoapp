import React from 'react';
import {
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';
import './activities.css';
import axios from 'axios';

/**
 * Define Activities, a React compoment of CS142 project #8
 */
class Activities extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activities: []
    }
  
    this.handleDeleteUser = this.handleDeleteUser.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  componentDidMount() {
    axios.get('/activities').then((response) => {
      this.setState({
        activities: response.data
      });
      
      //Must call this handler in the parent to update TopBar context
      this.props.handler('Activities');
    })
    .catch(function (error) {
          console.log(error);
    });
  }

  componentDidUpdate(prevProps) {
    //Only call setState if another user was clicked on
    if (this.props.match.params.userId !== prevProps.match.params.userId) {
      axios.get('/activities').then((response) => {
        this.setState({
          activities: response.data
        });

        //Must call this handler in the parent to update TopBar context
        this.props.handler('Activities');
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

  handleRefresh(event) {
    axios.get('/activities').then((response) => {
      this.setState({
        activities: response.data
      });
    })
    .catch(function (error) {
          console.log(error);
    });

    event.preventDefault();
  }

  isUserDeleteAllowed() {
    if (this.props.match.params.userId === this.props.loggedInUser._id) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    console.log('activity', this.state.activities);
    return (
      <div className="cs142-userdetail-container">
        <Typography variant="headline">
          <center>Activities:</center>
          <p />
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.state.activities.map( (activity, activityIndex) => (
              <TableRow key={activityIndex}>
                <TableCell align="right">{activity.date_time}</TableCell>
                <TableCell align="right">{activity.user.first_name + ' ' + activity.user.last_name}</TableCell>
                <TableCell align="right">{activity.type}</TableCell>
                <TableCell align="right">
                { activity.photo ?
                    <img src={"/images/" + activity.photo.file_name} height='30' width='30' />
                    :
                    ''
                }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <form onSubmit={this.handleRefresh} className="cs142-topbar-logout">
          <center>
            <Button type='submit' variant='contained' color='default'>
            Refresh
          </Button>
        </center>
        </form>
      </div>
    );
  }
}

export default Activities;
