import React from 'react';
import {
  Typography,
  Card,
  CardMedia,
  CardContent,
  Link,
  TextField,
  Button
} from '@material-ui/core';
import './userPhotos.css';
import axios from 'axios';

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      photos: [],
      comments: {},
      commentResponse: {}
    }

    this.handleCommentField = this.handleCommentField.bind(this);
    this.handleSubmitComment = this.handleSubmitComment.bind(this);
    this.handleSubmitLike = this.handleSubmitLike.bind(this);
    this.handleSubmitUnlike = this.handleSubmitUnlike.bind(this);
    this.handleSubmitDeleteComment = this.handleSubmitDeleteComment.bind(this);
    this.handleDeletePhoto = this.handleDeletePhoto.bind(this);
  }

  componentDidMount() {
    axios.get('/photosOfUser/' + this.props.match.params.userId)
      .then((response) => {
        this.setState({
          photos: response.data
        });
      })
      .catch(function (error) {
        console.log(error);
      });

    axios.get('/user/' + this.props.match.params.userId)
      .then((response) => {
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
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          this.setState({
            photos: response.data
          });
        })
        .catch(function (error) {
          console.log(error);
        });

      axios.get('/user/' + this.props.match.params.userId)
        .then((response) => {
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

  handleCommentField(event, photo_id){
    let comments = {...this.state.comments};
    comments[photo_id] = event.target.value;
    this.setState({ comments: comments});
  }

  handleSubmitLike(event, photo_id) {
    axios.post('/likesOfPhoto/' + photo_id, { action: 'like' }).then(() => {
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          this.setState({
            photos: response.data,
          });
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

  handleSubmitUnlike(event, photo_id) {
    axios.post('/likesOfPhoto/' + photo_id, { action: 'unlike' }).then(() => {
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          this.setState({
            photos: response.data,
          });
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

  isPhotoLiked(photo) {
    //console.log('this is photo likes', photo.likes);
    for (let i = 0; i < photo.likes.length; i++) {
      //console.log('comparing', this.props.loggedInUser, 'and', photo.likes[i].user_id);
      if (this.props.loggedInUser._id === photo.likes[i].user_id) {
        return true;
      }
    }
    return false;
  }

  isCommentDeleteAllowed(comment) {
    if (comment.user._id === this.props.loggedInUser._id) {
      return true;
    } else {
      return false;
    }
  }

  isPhotoDeleteAllowed(photo) {
    if (photo.user_id === this.props.loggedInUser._id) {
      return true;
    } else {
      return false;
    }
  }

  handleSubmitComment(event, photo_id) {
    //Submit POST request to add comment
    axios.post('/commentsOfPhoto/' + photo_id, { comment: this.state.comments[photo_id] }).then(() => {
      
      //Update page with the new comment included
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          let comments = {...this.state.comments};
          comments[photo_id] = '';

          let commentResponse = {...this.state.commentResponse};
          commentResponse[photo_id] = '';

          this.setState({
            photos: response.data,
            comments: comments,
            commentResponse: commentResponse
          });
        })
        .catch( (error) => {
          console.log(error);
        });
    })
    .catch( (error) => {
      let commentResponse = {...this.state.commentResponse};
      commentResponse[photo_id] = error.response.data;

      this.setState({
        commentResponse: commentResponse,
      });
    });
    
    event.preventDefault();
  }

  handleSubmitDeleteComment(event, photo_id, comment_id) {
    //Submit POST request to delete comment
    axios.post('/deleteCommentOfPhoto', { photo_id: photo_id, comment_id: comment_id }).then(() => {
      
      //Update page with the new comment included
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          this.setState({
            photos: response.data,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch( (error) => {
      console.log(error);
    });    
  }

  handleDeletePhoto(event, photo_id) {
    //Submit POST request to delete comment
    axios.post('/deletePhoto', { photo_id: photo_id }).then(() => {
      
      //Update page with the new comment included
      axios.get('/photosOfUser/' + this.props.match.params.userId)
        .then((response) => {
          this.setState({
            photos: response.data,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch( (error) => {
      console.log(error);
    });
  }

  render() {
    //console.log('photos', this.state.photos)
    this.state.photos.sort((a, b) => {
      if (a.likes.length < b.likes.length) {
        return 1;
      } else if (a.likes.length > b.likes.length) {
        return -1;
      } else {
        let date_time_a = new Date(a.date_time);
        let date_time_b = new Date(b.date_time);
        if (date_time_a < date_time_b) {
          return 1;
        } else if (date_time_a > date_time_b) {
          return -1;
        } else {
          return 0;
        }
      }
    });

    return (
      <div className="cs142-userphotos-container">
        {this.state.photos.map((photo, photoIndex) => {
          if(typeof photo.comments === "undefined"){
            photo.comments = [];
          }
          return (
            <div key={photoIndex}>
            <Card className="">
              <CardMedia className="cs142-card-media" image={"/images/" + photo.file_name} />
              <CardContent>
                
                { this.isPhotoLiked(photo) ? 
                    <form onSubmit={(event) => this.handleSubmitUnlike(event, photo._id)} >

                      <Button type='submit' variant='contained' color='primary' style={{minWidth: '80px'}}>
                      Unlike
                      </Button>
                      <Typography style={{display: 'inline-block'}}>
                        {this.state.photos[photoIndex].likes.length === 1 ? 
                          <span>&nbsp;&nbsp;&nbsp;{this.state.photos[photoIndex].likes.length + "  "} like</span>
                          : 
                          <span>&nbsp;&nbsp;&nbsp;{this.state.photos[photoIndex].likes.length + "  "} likes</span>}
                      </Typography>
                      <img className="cs142-photos-like-button" src="https://saneteachers.files.wordpress.com/2015/12/1508162_471028019730233_202295764181390168_n.png" height='35' width='35' />
                      
                    </form>
                  :
                    <form onSubmit={(event) => this.handleSubmitLike(event, photo._id)} >
                      <Button type='submit' variant='contained' color='primary' style={{minWidth: '80px'}}>
                      Like
                      </Button>
                      <Typography style={{display: 'inline-block'}}>
                        {this.state.photos[photoIndex].likes.length === 1 ? 
                          <span>&nbsp;&nbsp;&nbsp;{this.state.photos[photoIndex].likes.length + "  "} like</span> 
                          : 
                          <span>&nbsp;&nbsp;&nbsp;{this.state.photos[photoIndex].likes.length + "  "} likes</span>}
                      </Typography>
                    </form>
                }

                <Typography variant='caption'>
                Created on {photo.date_time}
                </Typography>

                <br />

                <Typography variant='headline'>
                Comments
                </Typography>
                {photo.comments.map((comment, commentIndex) => 
                    <div key={commentIndex}>
                      <Typography>
                        <br />
                        <Link href={"#/users/" + comment.user._id} >
                          <strong>{comment.user.first_name + " " + comment.user.last_name}</strong>
                        </Link>
                        <span className="cs142-cardcontent-comment-text"> {comment.comment}</span>
                        <br />
                        <span className="cs142-cardcontent-comment-datetime">
                          {comment.date_time}{'   '}
                          { this.isCommentDeleteAllowed(comment) ?
                            <span className="cs142-cardcontent-delete-comment" onClick={(event) => this.handleSubmitDeleteComment(event, photo._id, comment._id)}>
                              <strong>Delete comment</strong>
                            </span>
                            :
                            ''
                          }
                        </span>
                      </Typography>
                    </div>
                  )}
                <br />

                <form onSubmit={(event) => this.handleSubmitComment(event, photo._id)} >
                  <TextField  variant='outlined' 
                              id={photo._id} 
                              value={this.state.comments[photo._id] ? this.state.comments[photo._id] : ''}
                              label='Post new comment' 
                              onChange={(event) => this.handleCommentField(event, photo._id)} 
                  />
                  <Typography variant="subtitle1" color='secondary'>
                  {this.state.commentResponse[photo._id]}
                  </Typography>
                  <p />
                  <Button type='submit' variant='contained' color='primary'>
                  Submit comment
                  </Button>
                </form>

                { this.isPhotoDeleteAllowed(photo) ?
                  <span className='cs142-photos-delete'>
                    <form onSubmit={(event) => this.handleDeletePhoto(event, photo._id)} >
                      <Button type='submit' variant='contained' color='secondary' size='small'>
                      Delete photo
                      </Button>
                    </form>
                  </span>
                  :
                  ''
                }
                
                <p />
              </CardContent>
            </Card>
            <p />
            </div>
          )
        })}
      </div>
    );
  }
}

export default UserPhotos;
