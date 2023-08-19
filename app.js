require("dotenv").config();
const express = require("express"); //for route handling
const mongoose = require("mongoose"); //database
const jwt = require("jsonwebtoken"); //authentication and authorization
const cookieParser = require("cookie-parser"); //storing JWT generated for authentication

const multer = require("multer");

const bcrypt = require("bcrypt"); //securing passwords
const saltRounds = 10;
const PORT = process.env.PORT | 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//using multer to handle storage of files (posts)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Define the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Define the filename
  },
});
const upload = multer({ storage: storage });
// app.use(express.json());

//setup a connection to the mongo database.
mongoose.connect(process.env.MONGO_URL);

//a new schema to store the username, email, and hash of every user.
const socialMediaUsers = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePic: String,
  profileVisits: { type: Number, default: 0 },
  following: Array,
  followedBy: Array,
  bio: { type: String, default: "" },
  gender: { type: String, default: "" },
});

const Post = new mongoose.Schema({
  username: String,
  imgPath: String,
  caption: String,
  date: String,
  likes: { type: Number, default: 0 },
  likedBy: Array,
  dislikes: { type: Number, default: 0 },
  dislikedBy: Array,
  comments: Array,
});

//schema to store all the posts of a given user. the posts array contains an array of posts, where
//each post is of a different schema that contains information about the likes, dislikes, comments on that post.
const socialMediaPosts = new mongoose.Schema({
  username: String,
  posts: [Post],
});

const User = mongoose.model("socialMediaUser", socialMediaUsers);
const singlePost = mongoose.model("singlePost", Post);
const Posts = mongoose.model("socialMediaPost", socialMediaPosts);

//register a user
app.post("/users/register", (req, res) => {
  const { username, email, password, gender, bio } = req.body; //password is the user-input plain password.
  res.clearCookie("token");
  //check if a user with that username already exists or not
  User.find({ $or: [{ username: username }, { email: email }] })
    .then((users) => {
      if (users.length !== 0) {
        res.send("User already exists.");
      } else {
        //if no such user exists, salt and hash the input password, and store the hash, email, username.
        bcrypt
          .hash(password, saltRounds)
          .then((hash) => {
            const newUser = new User({
              username: username,
              email: email,
              password: hash,
              gender: gender,
              bio: bio,
            });
            newUser
              .save()
              .then(() => {
                new Posts({ username: username })
                  .save()
                  .then(() => {
                    res.send("Successfully saved user");
                  })
                  .catch(() => {
                    res.send("Error occurred while registering user.");
                  });
              })
              .catch(() => {
                res.send("Some error occurred while saving user");
              });
          })
          .catch((err) => res.send("Error: " + err));
      }
    })
    .catch((err) => res.send(err));
});

//login a user
app.post("/users/login", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username }).then((foundUser) => {
    if (!foundUser) {
      res.send("User does not exist.");
    } else {
      bcrypt.compare(password, foundUser.password).then(function (result) {
        if (result) {
          const token = jwt.sign(
            { username: username },
            process.env.SECRET_KEY
          );
          //storing the generated token as a cookie so to send the JWT along with required routes.
          res.cookie("token", token);
          res.json({ token }); //get hold of token here and use it as authorization header value for further requests
        } else {
          res.send("Incorrect password!");
        }
      });
    }
  });
});

//log out the user
app.post("/users/logout", (req, res) => {
  if (req.cookies["token"] !== undefined) {
    res.clearCookie("token");
    res.send("Successfully logged out!");
  } else {
    res.send("No user is currently logged in.");
  }
});

//populate feed of user with the users he follows. if no users followed, show no posts.
app.get("/users/home", authenticateToken, (req, res) => {
  const username = req.username;
  User.findOne({ username: username })
    .then((foundUser) => {
      if (foundUser) {
        //only get the posts of the users that the user follows.
        const following = foundUser.following;
        let len = following.length;
        if (len === 0) {
          res.send("No posts available to show (follow some users first).");
        } else {
          const posts = [];
          //finding all the posts of all the users that the user follows.
          Posts.find({ username: { $in: following } })
            .then((foundFollowingUsers) => {
              //pushing the contents of each post of each followed user.
              foundFollowingUsers.forEach((user) => {
                posts.push(...user.posts);
              });
              //shuffle the order of posts shown in the feed.
              // Durstenfeld shuffle algorithm
              for (var i = posts.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = posts[i];
                posts[i] = posts[j];
                posts[j] = temp;
              }
            })
            .then(() => {
              res.send(posts);
            })
            .catch(() => {
              res.send("Could not populate feed.");
            });
        }
      }
    })
    .catch(() => {
      res.send("Error retrieving user.");
    });
});

//show all posts of a specified user.
app.get("/users/:username/posts", authenticateToken, (req, res) => {
  const username = req.params.username;
  Posts.findOne({ username: username })
    .then((foundUser) => {
      if (foundUser) {
        if (req.username !== username) {
          foundUser.profileVisits += 1;
        }
        foundUser
          .save()
          .then(() => {
            if (foundUser.posts.length === 0) {
              res.send("The user has not posted anything.");
            } else {
              res.send(foundUser.posts);
            }
          })
          .catch(() => {
            res.send("Could not update profile visits count.");
          });
      } else {
        res.send("No such user exists.");
      }
    })
    .catch(() => {
      res.send("Error occurred while fetching posts.");
    });
});

//follow a user
app.post("/users/:username/follow", authenticateToken, (req, res) => {
  const userToFollow = req.params.username;
  const userSendRequest = req.username;
  if (userToFollow === userSendRequest) {
    res.send("You cannot follow yourself.");
  } else {
    //add the user in the followedBy array of the user to follow.
    User.findOne({ username: userToFollow })
      .then((foundUser) => {
        if (foundUser) {
          const isFollowed = foundUser.followedBy.find(
            (user) => user === userSendRequest
          );
          if (isFollowed) {
            //can't follow the same user twice from the same account.
            res.send("You already follow this user.");
          } else {
            foundUser.followedBy.push(userSendRequest);
            foundUser
              .save()
              .then(() => {
                //add the user in the following array of the user that wants to follow.
                User.findOne({ username: userSendRequest })
                  .then((requestUser) => {
                    requestUser.following.push(userToFollow);
                    requestUser
                      .save()
                      .then(() => {
                        res.send("Successfully followed the user!");
                      })
                      .catch(() => {
                        res.send("Could not follow the user.");
                      });
                  })
                  .catch(() => {
                    res.send("Could not follow the user.");
                  });
              })
              .catch(() => {
                res.send("Could not follow the user.");
              });
          }
        } else {
          res.send("User does not exist.");
        }
      })
      .catch(() => {
        res.send("Unable to process follow request.");
      });
  }
});

//unfollow a user
app.post("/users/:username/unfollow", authenticateToken, (req, res) => {
  const userToUnfollow = req.params.username;
  const userSendRequest = req.username;
  if (userToUnfollow === userSendRequest) {
    res.send("You cannot unfollow yourself.");
  } else {
    //add the user in the followedBy array of the user to follow.
    User.findOne({ username: userToUnfollow })
      .then((foundUser) => {
        if (foundUser) {
          const isFollowed = foundUser.followedBy.find(
            (user) => user === userSendRequest
          );
          if (isFollowed) {
            //can't follow the same user twice from the same account.
            User.updateOne(
              { username: userToUnfollow },
              {
                //remove the user from the followedBy array.
                $pull: {
                  followedBy: userSendRequest,
                },
              }
            )
              .then(() => {
                User.updateOne(
                  { username: userSendRequest },
                  {
                    $pull: {
                      following: userToUnfollow,
                    },
                  }
                )
                  .then(() => {
                    res.send("Successfully unfollowed the user.");
                  })
                  .catch(() => {
                    res.send("Could not unfollow the user.");
                  });
              })
              .catch(() => {
                res.send("Error occurred while unfollowing the user.");
              });
          } else {
            res.send("You do not follow this user.");
          }
        } else {
          res.send("User does not exist.");
        }
      })
      .catch(() => {
        res.send("Unable to process unfollow request.");
      });
  }
});

//like the post of a user
app.post("/users/:username/:postID/like", authenticateToken, (req, res) => {
  const username = req.params.username; //the username of the user who's post is to be liked
  const postID = req.params.postID;
  if (username === req.username) {
    //req.username is the username of the authenticated user (the user who wants to like the post)
    res.send("Cannot like your own post.");
  } else {
    Posts.findOne({ username: username })
      .then((foundUser) => {
        const postToUpdate = foundUser.posts.find(
          (post) => post._id.toString() === postID
        );
        if (postToUpdate) {
          const isLikedBy = postToUpdate.likedBy.find(
            (user) => user === req.username
          );
          if (isLikedBy) {
            res.send("Cannot like the same post twice.");
          } else {
            postToUpdate.likes += 1;
            postToUpdate.likedBy.push(req.username);
            foundUser
              .save()
              .then(() => {
                res.send("Liked the post.");
              })
              .catch(() => {
                res.send("Could not like the post.");
              });
          }
        } else {
          res.send("Invalid post.");
        }
      })
      .catch(() => {
        res.send("Error retrieving the post.");
      });
  }
});

//dislike the post of a user
app.post("/users/:username/:postID/dislike", authenticateToken, (req, res) => {
  const username = req.params.username; //the username of the user who's post is to be liked
  const postID = req.params.postID;
  if (username === req.username) {
    //req.username is the username of the authenticated user (the user who wants to like the post)
    res.send("Cannot dislike your own post.");
  } else {
    Posts.findOne({ username: username })
      .then((foundUser) => {
        const postToUpdate = foundUser.posts.find(
          (post) => post._id.toString() === postID
        );
        if (postToUpdate) {
          const isDislikedBy = postToUpdate.dislikedBy.find(
            (user) => user === req.username
          );
          if (isDislikedBy) {
            res.send("Cannot dislike the same post twice.");
          } else {
            postToUpdate.dislikes += 1;
            postToUpdate.dislikedBy.push(req.username);
            foundUser
              .save()
              .then(() => {
                res.send("Disliked the post.");
              })
              .catch(() => {
                res.send("Could not dislike the post.");
              });
          }
        } else {
          res.send("Invalid post.");
        }
      })
      .catch(() => {
        res.send("Error retrieving the post.");
      });
  }
});

//add comment on a post.
app.post("/users/:username/:postID/comment", authenticateToken, (req, res) => {
  const username = req.params.username; //user who's post we want to comment on
  const postID = req.params.postID;
  const comment = req.body.comment; //in the urlencoded form, not form-data.
  if (comment.length === 0) {
    res.send("Cannot post empty comment.");
  } else {
    Posts.findOne({ username: username })
      .then((foundUser) => {
        const postToUpdate = foundUser.posts.find(
          (post) => post._id.toString() === postID
        );
        if (postToUpdate) {
          postToUpdate.comments.push({
            user: req.username,
            comment: comment,
            commIndex: postToUpdate.comments.length,
          });
          foundUser
            .save()
            .then(() => {
              res.send("Added a comment on the post.");
            })
            .catch(() => {
              res.send("Could not comment on the post.");
            });
        } else {
          res.send("Invalid post.");
        }
      })
      .catch(() => {
        res.send("Error retrieving the post.");
      });
  }
});

//delete a comment
app.delete("/users/:postID/:commentID/", authenticateToken, (req, res) => {
  const username = req.username; //post of which user.
  const postID = req.params.postID;
  const commentIndex = req.params.commentID; //in the urlencoded form, not form-data.

  Posts.findOne({ username: username })
    .then((foundUser) => {
      const postToUpdate = foundUser.posts.find(
        (post) => post._id.toString() === postID
      );
      if (postToUpdate) {
        let commentToDelete;
        postToUpdate.comments.forEach((comment) => {
          if (comment.commIndex === parseInt(commentIndex)) {
            commentToDelete = comment;
          }
        });

        const index = postToUpdate.comments.indexOf(commentToDelete);

        if (index > -1) {
          postToUpdate.comments.splice(index, 1);
          foundUser
            .save()
            .then(() => {
              res.send("Successfully deleted the comment");
            })
            .catch(() => {
              res.send("Unable to delete the comment.");
            });
        } else {
          res.send("No comment with this index exists on this post.");
        }
      } else {
        res.send("Cannot find the post.");
      }
    })
    .catch(() => {
      res.send("Could not retrieve the user.");
    });
});

//get profile of any user (remove password field and email field for security.)
//even if password field is obtained, it is hashed so it is unusable.
app.get("/users/:username/", authenticateToken, (req, res) => {
  const username = req.params.username;
  User.findOne({ username: username })
    .then((foundUser) => {
      if (foundUser) {
        Posts.findOne({ username: username })

          .then((foundPosts) => {
            if (req.username !== username) {
              foundUser.profileVisits += 1;
            }
            foundUser
              .save()
              .then(() => {
                res.send({
                  ...foundUser._doc,
                  ...foundPosts._doc,
                  password: "",
                  email: "",
                });
              })
              .catch(() => {
                res.send("Could not update profile visits count.");
              });
          })
          .catch(() => {
            res.send("Unable to fetch posts of the user.");
          });
      } else {
        res.send("Unable to find user.");
      }
    })
    .catch(() => {
      res.send("Error retrieving profile.");
    });
});

//logged in user creating a new post.
app.post(
  "/users/posts/",
  authenticateToken,
  upload.single("file"),
  (req, res) => {
    // Access the filename of the uploaded file
    const uploadedFileName = "./uploads/" + req.file.filename;
    function getLastCharacters(inputString, numCharacters) {
      return inputString.slice(-numCharacters);
    }

    const extension = getLastCharacters(uploadedFileName, 3);
    const jpegExtension = getLastCharacters(uploadedFileName, 4);
    if (
      extension !== "jpg" &&
      extension !== "mp4" &&
      extension !== "png" &&
      extension !== "mov" &&
      jpegExtension !== "jpeg"
    ) {
      res.send(
        "Invalid file format. Please use a .jpg, .mp4, .png, .jpeg, .mov format."
      );
    } else {
      const caption = req.body.caption;
      const date = new Date().toLocaleDateString();
      const post = new singlePost({
        date: date,
        username: req.username,
        imgPath: uploadedFileName,
        caption: caption,
      });
      Posts.findOneAndUpdate(
        { username: req.username },
        { $push: { posts: post } }
      )
        .then(() => {
          res.json({
            message: "Successfully created a new post!",
            caption: caption,
            filename: uploadedFileName,
          });
        })
        .catch(() => {
          res.send("Error occurred while creating new post.");
        });
    }
  }
);

//delete a post
app.delete("/users/:postID", authenticateToken, (req, res) => {
  const username = req.username;
  const postID = req.params.postID;


    Posts.updateOne(
      { username: username },
      { $pull: { posts: { _id: postID } } }
    )
      .then((result) => {
        if (result.modifiedCount > 0) {
          res.send("Successfully deleted the post!");
        } else {
          res.send("Post does not exist.");
        }
      })
      .catch((error) => {
        res.send("Error deleting post:", error);
      });
});

//update the password of a user
app.patch("/users/profile/password", authenticateToken, (req, res) => {
  User.findOne({ username: req.username })
    .then((user) => {
      const { password } = req.body;
      bcrypt.compare(password, user.password).then(function (result) {
        if (result) {
          res.send("Can't update to the same password.");
        } else {
          bcrypt
            .hash(password, saltRounds)
            .then((hash) => {
              User.updateOne({ username: user.username }, { password: hash })
                .then(() => {
                  res.send("Successfully updated user's password.");
                })
                .catch(() => {
                  res.send("Error occurred while updated password.");
                });
            })
            .catch(() => {
              res.send("Error occurred while comparing passwords.");
            });
        }
      });
    })
    .catch((error) => {
      res.status(500).json({ error: "Error retrieving user profile" });
    });
});

//update the bio of a user
app.patch("/users/profile/bio", authenticateToken, (req, res) => {
  User.findOne({ username: req.username })
    .then((user) => {
      const { bio } = req.body;
      User.updateOne({ username: user.username }, { bio: bio })
        .then(() => {
          res.send("Successfully updated bio!");
        })
        .catch(() => {
          res.send("Error occurred while updating bio.");
        });
    })
    .catch((error) => {
      res.status(500).json({ error: "Error retrieving user profile" });
    });
});

app.patch(
  "/users/profile/profilepic",
  authenticateToken,
  upload.single("file"),
  (req, res) => {
    // Access the filename of the uploaded file
    const uploadedFileName = "./uploads/" + req.file.filename;
    function getLastCharacters(inputString, numCharacters) {
      return inputString.slice(-numCharacters);
    }

    const extension = getLastCharacters(uploadedFileName, 3);
    const jpegExtension = getLastCharacters(uploadedFileName, 4);
    if (
      extension !== "jpg" &&
      extension !== "png" &&
      jpegExtension !== "jpeg"
    ) {
      res.send("Invalid file format. Please use a .jpg, .png, .jpeg format.");
    } else {
      User.findOneAndUpdate(
        { username: req.username },
        { profilePic: uploadedFileName }
      )
        .then(() => {
          res.json({
            message: "Successfully updated your profile pic!",
            filename: uploadedFileName,
          });
        })
        .catch(() => {
          res.send("Error occurred while updating profile pic.");
        });
    }
  }
);

app.get("/test", (req, res) => {
  res.send("Hi");
});

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.username = user.username;
    next();
  });
}

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
