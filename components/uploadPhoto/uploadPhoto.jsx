import React from 'react';
import {
  Typography,
  Button,
}
from '@material-ui/core';
import './uploadPhoto.css';
import axios from 'axios';

/**
 * Define UserList, a React componment of CS142 project #5
 */
class UploadPhoto extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uploadResponse: ''
    }
    
    this.handlePhotoUploadButton = this.handlePhotoUploadButton.bind(this);
  }

  handlePhotoUploadButton(event) {
    if (this.uploadInput.files.length > 0) {
      // Create a DOM form and add the file to it under the name uploadedphoto
      const domForm = new FormData();
      domForm.append('uploadedphoto', this.uploadInput.files[0]);
      axios.post('/photos/new', domForm)
        .then((response) => {
          this.setState({
            uploadResponse: response.data
          });
        })
        .catch( (error) => {
          this.setState({
            uploadResponse: error.response.data
          });
        });
    } else {
      this.setState({
        uploadResponse: 'Please select a file.'
      });
    }
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <Typography variant="headline">
          <center>Upload photo:</center>
          <p />
        </Typography>
        <center>
        <form onSubmit={this.handlePhotoUploadButton}>
          <input type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
          <Button type='submit' variant='contained' color='primary'>
          Upload photo
          </Button>
          <Typography variant="subtitle1" color='secondary'>
          {this.state.uploadResponse}
          </Typography>
        </form>
        </center>
      </div>
    );
  }
}

export default UploadPhoto;