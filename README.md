<ins>**Name**</ins>: Vatsal Bhuva <br />
<ins>**Enrollment Number**</ins>: IIT2022004 <br />
<ins>**Bucket**</ins>: Backend <br />

<hr>
<h1>The Social Media Mastery </h1>
<p> A fully functioning social media website's backend, crafted together using <strong><ins>Express, Node.js, Multer, bcrypt, and more! </ins></strong></p>
<hr>

<h3><strong><ins>Libraries used</strong></ins></h3>
<ol>
    <li><strong><ins>express</strong></ins>
        <p>To handle the different HTTP requests.</p>
    </li>
    <li><strong><ins>mongoDB</strong></ins>
        <p>Backbone of it all. Stores all the information, using which the HTTP requests access/store information</p>
    </li>
    <li><strong><ins>node.js</strong></ins>
        <p>To install the different npm packages.</p>
    </li>
    <li><strong><ins>multer</strong></ins>
        <p>To upload and store files as posts/pictures/videos.</p>
    </li>
    <li><strong><ins>bcrypt</strong></ins>
        <p>Security is key. This enables hashing and salting passwords to secure the user's information. So, in the event of a data leak, only the hashed password is available which is very hard to crack.</p>
    </li>
    <li><strong><ins>jwt</strong></ins>
        <p>Enables you to "stay logged in" across the different routes. JWT handles the authentication part so you don't have to login again and again.</p>
    </li>
    <li><strong><ins>cookieParser</strong></ins>
        <p>Storing the JWT key in a cookie allows the JWT to be verified, ensuring that only a logged in user can perform most of the activities.</p>
    </li>
</ol>

<h2 style="border-bottom: none"><ins>Installation</ins></h2>
As this application is composed entirely of the backend part of a social media website,
we require <strong>Postman</strong> to make HTTP requests to the various
routes. <br><br>

<p> Paste the following link to open postman in your browser to directly simulate the requests.</p>

```
https://www.postman.com/universal-comet-532028/workspace/webd-task2-iit2022004/collection/29122774-5240a42b-9036-4b8e-912c-5082ffd517c5?action=share&creator=29122774
```

<hr>

<h2>Usage
</h2>



<li>Expand the 'Requests' tab to view the titles of the different requests that you make</li><br>

![screenshot](assets/screenshots/integration-testing.png)

<li>The userRequests tab enlists all the user-related options that are available for this social media website. Likewise, the postRequests tab enlists all the post-related options that a user can make.</li><br>

![image](/assets/screenshots/expand-tabs.png)

<li>To get started, click on the "Register" option under the userRequests tab. Under the "Body" section on the right, and under the "x-www-form-urlencoded" tab, enter the details of the user that you want to register as (remember your username and password!)</li><br>

![image](/assets/screenshots/register.png)

<li>Once registered, head over to the "Login" section, and login with the correct credentials. Without logging in, you will not be able to access the various different functionalities, other than being able to view the profile of users (just like instagram allows you to view the profile of another user without logging in.)</li><br>

![image](/assets/screenshots/login.png)

<li>Upon successfully logging in, you should receive a "token" in the response section at the bottom. This is your JWT token, which is used to authenticate you as a logged in user across the different routes. You don't need to store the token anywhere, it's taken care of by 🍪 ;)</li><br>

![image](/assets/screenshots/login-token.png)

<hr>
Let's have a look at the different functionalities of the website, and how to use them.

<h3> User Requests </h3>
<li><ins>Logout</ins>: Nothing to do; click on the send option to log out from the currently logged in user.</li>

<li><ins>View profile</ins>: This lets you view the profile information of any user. It does not require for you to be logged in. Type in the username of the user who's profile you want to view under the "Params" tab, not the "Body" tab like we've been doing so far.
</li><br>

![image](/assets/screenshots/view-profile.png)

<li><ins>Follow request:</ins> Want to make friends? Follow them up! Following a user lets you see their posts in your feed. Enter their username in the "Params" tab to follow them.
</li><br>

<li><ins>Unfollow request:</ins> Same functionality as the Follow feature.
</li><br>

<li><ins>Update user password:</ins> Didn't I tell you to remember your password? No worries, got your back. Head over to this request to change your password. The new password should be entered as the value to the password attribute under the "Body -> x-www-urlencoded" tab.
</li><br>

![image](/assets/screenshots/update-password.png)

<li><ins>Update user bio:</ins> Let others get to know more about you through your bio! Update your bio using this request, and showcase your specs!
</li><br>

<li><ins>Update profile pic:</ins> Haven't seen me yet? View my profile pic! Under the "Body -> form-data" section, select the profile pic that you want to upload!
</li><br>

![image](/assets/screenshots/profile-pic.png)

<strong>Note: the profile won't be visible as this is just the backend part. The image can, however, be rendered using frontend as the image's relative path is stored in the database. The same applies to viewing a user's posts as well.</strong>


<hr>

<h3> Post Requests </h3>

<li><ins>Create post:</ins> Share where you've been this summer or your outing with your friends and much more! Head over to the "Body -> form-data" section, and select the image/video that you want to post! Don't forget to add a suitable magical caption to captivate your followers!
</li><br>

![image](/assets/screenshots/create-post.png)

<li><ins>Like a post:</ins> Show your support to your close ones by liking their posts! Under the "Params" section, enter the username to whom the post belongs, and the ID of the post that you want to like. <strong>NOTE: the postID can be obtained by viewing the posts/profile of that user, and in the posts array will be listed all the posts with each post having a unique "_id" attribute. Copy the inner text (don't copy the ObjectID part) and paste it in the postID attribute.</strong>
(don't be cheeky to like your own post or like the same post twice :) i've got that covered :))
</li><br>

![image](assets/screenshots/post-id.jpg)
![image](/assets/screenshots/like-post.png)

<li><ins>Dislike a post: </ins>Same usage as liking a post.
</li><br>

<li><ins>Comment on a post: </ins>Express (no pun intended) your thoughts on your friend's posts to flatter them :)
Enter the username and the postID (the same way as in liking a post), and enter your comment in the "Body -> x-www-form-urlencoded" section, under the "comment" attribute.
</li><br>

![image](/assets/screenshots/comment.png)

<li><ins>View feed: </ins>Following your friends? View what they're upto in your feed! Your feed shows your your following's posts in a randomized order to make it more natural! Just click the send button to view your feed!
</li><br>

<li><ins>View posts of a user: </ins>View the posts of a specific user by heading over to this section, and entering the username of that user under the "username" attribute, in the "Params" section.
</li><br>

![image](/assets/screenshots/view-posts.png)

<li><ins>Delete a post: </ins>Uploaded the wrong post? Or did you have a "felt cute might delete later" moment? Delete your post right away by mentioning the ID of your post!
</li><br>

<li><ins>Delete a comment: </ins>Didn't like what someone commented on your post? Mention the postID, and the commentID of the comment to delete the comment right away! The postID and the commentID can be obtained by viewing the profile or the posts of a user. The commentID will be the value of the "commIndex" attribute of the specific comment. 
</li><br>

![image](/assets/screenshots/comment-index.png)

<hr>

<h3>Contacts</h3>
Mail me at: <a href="mailto: vatsalbhuva11@gmail.com" >vatsalbhuva11@gmail.com</a>

LinkedIn: <a href="https://www.linkedin.com/in/vatsal-bhuva-673587233/">https://www.linkedin.com/in/vatsal-bhuva-673587233/</a>
Instagram: <a href="https://www.instagram.com/_.vb11/">https://www.instagram.com/_.vb11/</a>
