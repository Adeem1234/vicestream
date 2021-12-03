const express = require('express'),
   http = require('http'),
   app = express(),
   fs = require("fs"),
   multer = require("multer"),
   server = http.createServer(app),
   io = require('socket.io').listen(server);
   const path = require("path");

   const port =process.env.Port || 3000
app.get('/', (req, res) => {

   res.send(' Server is running on port 3000')
});

//post url request
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

// for mangodb database
var mongoose = require('mongoose');
const LiveSteamer = require('./models/streamerLiveModel')
const LiveComments = require('./models/comment');
const LiveMessages = require('./models/message');
const Calls = require('./models/calls');
const Users = require('./models/user');
const { send } = require('process');


var dbUrl = "mongodb+srv://a:abc1234abc@cluster0.y9hum.mongodb.net/Live_Stream?retryWrites=true&w=majority";
mongoose.connect(dbUrl).then(() => {

   console.log('MongoDb database connected')
}).catch(err => console.log(err))


app.get('/', (req, res) => {

   res.send('Chat Server is running on port 3000')
});

io.on('connection', (socket) => {

   console.log('Streamer connected')

   socket.on('iAMLiveNow', function (modelId, modelName, modelImage, modelViewers, modelDistance, modelIsTrending, modelStreamerMail, modelIsLive, modelTimeGoLive, modelChannelName) {

      console.log(modelName + " : is live now... ");
      console.log(modelChannelName + " : channelName... ");

      let modelJson = {
         "name": modelName,
         "image": modelImage,
         "viewers": modelViewers,
         "distance": modelIsTrending,
         "isTrending": modelStreamerMail,
         "streamerMail": modelIsLive,
         "isLive": modelDistance,
         "time_GoLive": modelTimeGoLive,
         "channelName": modelChannelName
      }


      let streamer = new LiveSteamer({
         data: [
            {
               name: modelName,
               image: modelImage,
               viewers: modelViewers,
               distance: modelDistance,
               isTrending: modelIsTrending,
               streamerMail: modelStreamerMail,
               isLive: modelIsLive,
               time_GoLive: modelTimeGoLive,
               channelName: modelChannelName
            }
         ]
      })


      console.log("this is streamer  to post" + streamer);

      streamer.save().then(() => {
         //broadcast means it will send to all except the sender
         socket.broadcast.emit('whoIsLiveNow', modelJson);
      })


   })

   socket.on('endStreamerLive', function (streamerMail) {

      console.log(streamerMail + ':ended  live.')


    //   LiveSteamer.findOne({
    //      streamerMail: streamerMail
    //   }, (err, stream) => {

    //      if (err) {

    //         console.log(err);
    //      }

    //      console.log("To be Deleted:" + stream);

    //      stream.delete(err => {
    //         if (err) {

    //            console.log(err);
    //         }


    //         socket.broadcast.emit("endLiveStreamer", "refreshing")
    //         socket.broadcast.emit("refreshStreamers", "refreshing")

    //      });

    //   });



	  var myquery = { data: { $elemMatch : {streamerMail: { $in: streamerMail}} }};
	  LiveSteamer.deleteMany(myquery, function (err, obj) {
		 if (err) throw err;
		 console.log(streamerMail+ ':Deleted! ');
		socket.broadcast.emit("endLiveStreamer", streamerMail)
		socket.broadcast.emit("refreshStreamers", "refreshing")

	  });





   })


   socket.on('NewViewerJoined', function (streamerId) {

      console.log(streamerId + ':joined the live.')

      socket.broadcast.emit("newViewersToStream", streamerId)

   })

   socket.on('disconnect', function () {
      socket.broadcast.emit("userdisconnect", ' user has left')

   })


   socket.on('commentdetection', (senderId, commentContent, receivermail, senderName, senderMail, sendingTime, senderImageUrl) => {

      //log the message in console

      console.log(senderName + " : " + commentContent)

      console.log(senderMail + " : SenderMail")

      console.log("Reciever : " + senderImageUrl)

      //create a message object


      let commentJson = {
         "_id": senderId,
         "sender": senderName,
         "senderMail": senderMail,
         "commentContent": commentContent,
         "receiver": receivermail,
         "time": sendingTime,
         "image": senderImageUrl
      }


      let comment = new LiveComments({
         data: [
            {
               sender: senderName,
               senderMail: senderMail,
               commentContent: commentContent,
               receiver: receivermail,
               time: sendingTime,
               image: senderImageUrl
            }
         ]
      })


      console.log("this is comment to post" + comment);

      comment.save().then(() => {
         // send the message to all users including the sender  using io.emit
         io.emit('OnNewComment', commentJson)

      })



   })

   socket.on('messagedetection', (senderId, messageContent, receivermail, senderName, senderMail, sendingTime, senderImageUrl) => {

	//log the message in console

	console.log(senderName + " : " + messageContent)

	console.log(senderMail + " : SenderMail")

	console.log("Reciever : " + senderImageUrl)

	//create a message object


	let messageJson = {
	   "_id": senderId,
	   "sender": senderName,
	   "senderMail": senderMail,
	   "messageContent": messageContent,
	   "receiver": receivermail,
	   "time": sendingTime,
	   "image": senderImageUrl
	}


	let message = new LiveMessages({
	   data: [
		  {
			 sender: senderName,
			 senderMail: senderMail,
			 messageContent: messageContent,
			 receiver: receivermail,
			 time: sendingTime,
			 image: senderImageUrl
		  }
	   ]
	})


	console.log("this is message to post" + message);

	message.save().then(() => {
	   // send the message to all users including the sender  using io.emit
	   io.emit('OnNewMessage', messageJson)
	   io.emit('incomingMessage', messageJson)
	})



 })

   socket.on('commentsTodelete', (receivermail) => {

      //log the message in console

      console.log(receivermail + "'s comments are ready to be deleted")

    //   var myquery = { receiver: receivermail };
    //   LiveComments.deleteMany(myquery, function (err, obj) {
    //      if (err) throw err;
    //      console.log(receivermail + "'s comment(s) deleted");
    //   });



	  var myquery = { data: { $elemMatch : {receiver: { $in: receivermail}} }};
	  LiveComments.deleteMany(myquery, function (err, obj) {
		 if (err) throw err;
		 console.log(receivermail + "'s comment(s) deleted");

	  });








   })


   socket.on('toGiveHeart', function (receiver) {
      console.log(receiver + ":To give heart called")
      socket.broadcast.emit("onGiveHeart", receiver)

   })

   socket.on('toGiveGift', function (receiver) {
      console.log(receiver + ":To give gift called")
      socket.broadcast.emit("onGiveGift", receiver)

   })

   socket.on('toSendViewersCount', function (countViewers,streamerMail) {
      console.log(countViewers + ":number of viewers")
	  console.log(streamerMail + ":streamer")

	  let viewerJson = {
		"countViewers": countViewers,
		"streamerMail": streamerMail
	 }

      socket.broadcast.emit("toSendViewersCountToViewer", viewerJson)

   })

   socket.on('onGoingCall', function (callerIdMail, callerName, callerImage, receiverIdMail, receiverName, receiverImage, channelName) {
      console.log("OnGoing call to :" + receiverIdMail)
      console.log("ChannelName :" + channelName)

      let onGoingJson = {
         "callerIdMail": callerIdMail,
         "callerName": callerName,
         "callerImage": callerImage,
         "receiverIdMail": receiverIdMail,
         "receiverName": receiverName,
         "receiverImage": receiverImage,
         "channelName": channelName

      }



      socket.broadcast.emit("incommingCall", onGoingJson)

   })

  socket.on('onAcceptCall', function (callerIdMail) {
      console.log(callerIdMail + ":call is accepted")
      socket.broadcast.emit("onCallIsAccepted", callerIdMail)

   })

socket.on('onRejectCall', function (callerIdMail) {
      console.log(callerIdMail + ":call is rejected")
	 io.emit("onCallIsRejected", callerIdMail) // for all
	  socket.emit("onCallIsRejected", callerIdMail)  // caller
   })

   socket.on('Hi', function (callerIdMail) {
      console.log(callerIdMail + ":call is rejected")


   })

   socket.on('OnVideoRequest', function (channelName, serverUrl, sdpMid, sdpMLineIndex, sdp, type) {
      console.log("OnGoing call type:" + type)
      console.log("ChannelName :" + channelName)

      let onGoingJson = {
         "channelName": channelName,
         "serverUrl": serverUrl,
         "sdpMid": sdpMid,
         "sdpMLineIndex": sdpMLineIndex,
         "sdp": sdp,
         "type": type

      }



      socket.broadcast.emit("OnVideoRequestGranted", onGoingJson)

   })

   socket.on('onAddCall', function (channelName, type, sdp) {
      console.log("onAddCall called")
     // console.log("onCall Request  type:" + type)
      console.log("ChannelName :" + channelName)
     // console.log("sdp :" + sdp)
      let onGoingJson = {
         "channelName": channelName,
         "type": type,
         "sdp": sdp
        }

        if(type=="OFFER"){
        socket.broadcast.emit("onOfferRecieved", onGoingJson)
        console.log("onCall Request  type:" + type)
        }
         else if(type=="ANSWER"){
        socket.broadcast.emit("onAnswerRecieved", onGoingJson)
        console.log("onCall Request  type:" + type)
         }

// let call = new Calls({
//    data: [
//       {
//          channelName: channelName,
//          type: type,
//          sdp: sdp
//       }
//    ]
// })

// console.log("call to be post" + call);
// call.save().then(() => {
//    // send the message to all users including the sender  using io.emit
//    //io.emit('OnNewComment', commentJson)
// })

    })

    socket.on('toGetCalls', function (channelName) {
      console.log("toGetCalls called")
      console.log(channelName + ":channal")

      Calls.find({}, (currentCalls) => {

    })

      })



socket.on("onNewUserAdded", function (userId, userName, userImage, userPhoneNumber, userEmail, userGender, userDob, userCountry, userHomeTown, userFollowers, userFollowing, userGifts, userdiamonds, userStars, userType) {

	console.log(userName + " : is redy for registered now... ");

	let modelJson = {
		"name": userName,
		"image": userImage,
		"phoneNumber": userPhoneNumber,
		"email": userEmail,
		"gender": userGender,
		"dateOfBirth": userDob,
		"country": userCountry,
		"homeTown": userHomeTown,
		"followers": userFollowers,
		"following": userFollowing,
		"gifts": userGifts,
		"diamonds": userdiamonds,
		"stars": userStars,
		"userType": userType
	}


	let userModel = new Users({
		data: [
			{
				name: userName,
				image: userImage,
				phoneNumber: userPhoneNumber,
				email: userEmail,
				gender: userGender,
				dateOfBirth: userDob,
				country: userCountry,
				homeTown: userHomeTown,
				followers: userFollowers,
				following: userFollowing,
				gifts: userGifts,
				diamonds: userdiamonds,
				stars: userStars,
				userType: userType
			}
		]
	})


	console.log("this is user  to post" + userModel);



	userModel.save().then(() => {
		// send the message to all users including the sender  using io.emit
		// io.emit('OnNewComment', modelJson)
	 })





})

socket.on("onUserUpdate", function (userId, userName, userImage, userPhoneNumber, userEmail, userGender, userDob, userCountry, userHomeTown, userFollowers, userFollowing, userGifts, userdiamonds, userStars, userType) {

	console.log(userName + " : is redy for update now... ");

	let modelJson = {
		"name": userName,
		"image": userImage,
		"phoneNumber": userPhoneNumber,
		"email": userEmail,
		"gender": userGender,
		"dateOfBirth": userDob,
		"country": userCountry,
		"homeTown": userHomeTown,
		"followers": userFollowers,
		"following": userFollowing,
		"gifts": userGifts,
		"diamonds": userdiamonds,
		"stars": userStars,
		"userType": userType
	}

console.log("this is user  to update" + modelJson);


	var myquery = { data: { $elemMatch : {name: { $in: userName}} }};
	Users.updateOne( myquery, modelJson, function(
		err,
		result
	  ) {
		if (err) {

		  console.log(err);

		} else {

		  console.log(result);

		}
	  });







})


})


// storage engine

const storage = multer.diskStorage({
   destination: './upload/images',
   filename: (req, file, cb) => {
       return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
   }
})

const upload = multer({
   storage: storage,
   limits: {
       fileSize: 10000000000000000
   }
})
app.use('/image', express.static('upload/images'));

app.post("/upload", upload.single('image'), (req, res) => {

   res.json({
       success: 1,
       profile_url: `http://vicestreams.com/image/${req.file.filename}`
   })
})

// endpoint to get all calls by channelName
app.get('/calls/channelName/:channelName', (req, res) => {
  Calls.find({  data: { $elemMatch : {channelName: { $in: req.params.channelName }} }}, (err, currentCalls) => {

      res.send(currentCalls);
   })




})


// endpoint to get all comments by id
app.get('/calls/:id', (req, res) => {
   Calls.find({ "_id": req.params.id  }, (err, currentCalls) => {
      res.send(currentCalls);
   })
})

// endpoint to get all live streamers
app.get('/livestreamers', (req, res) => {
   LiveSteamer.find({}, (err, streamers) => {
      if (err) {
         return res.send(err);
      }
      res.send(streamers);
  })


})


// endpoint to search live streamers  by name
app.get('/livestreamers/search/:name', (req, res) => {

	LiveSteamer.find({  data: { $elemMatch : {name: { $regex:'.*' + req.params.name+ '.*'}} }}, (err, streamers) => {

	 res.send(streamers);
  })


 })


// endpoint to get all comments by receiver
app.get('/comments/receiver/:receiver', (req, res) => {

   LiveComments.find({  data: { $elemMatch : {receiver: { $in: req.params.receiver}} }}, (err, comments) => {

	res.send(comments);
 })


})


// endpoint to get all messages by receiver
app.get('/messages/receiver/:receiver', (req, res) => {

	LiveMessages.find({  data: { $elemMatch : {receiver: { $in: req.params.receiver}} }}, (err, comments) => {

	 res.send(comments);
  })


 })

// endpoint to delete comment by receiver
app.delete('/comments/deleteMany/:receiver', (req, res) => {


  var myquery = { data: { $elemMatch : {streamerMail: { $in: req.params.receiver}} }};
   LiveSteamer.deleteMany(myquery, function (err, obj) {
      if (err) throw err;


	 if(obj)
	 {
		console.log("'s comment(s) deleted");

	 }
      res.json(obj);
   });


});

// endpoint to delete comment by sender
app.delete('/comments/delete/:sender', (req, res) => {
	LiveComments.findOne({
          sender: req.params.sender
   }, (err, comment) => {

          if (err) {
                 return res.send(err);
          }

          if (comment === null) {
                 return res.send({
                        msg: 'No matching user with name sam'
                 });
          }

          console.log(req.body);

          console.log("To be Deleted:" + comment);


          comment.delete(err => {
                 if (err) {

                        res.send(err);
                 }
                 res.json({ message: 'Deleted! ' });
          });

   });
});


// endpoint to check whether user is registered or not
app.get('/users/username/:name', (req, res) => {



	Users.find({  data: { $elemMatch : {name: { $in: req.params.name }} }}, (err, users) => {

		res.send(users);
	 })




 })


server.listen(port, () => {

   console.log(`Listening on port ${port}`)

})
