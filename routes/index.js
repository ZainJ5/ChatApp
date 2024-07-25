var express = require('express');
var router = express.Router();
const usersModel = require('./users')
const messageModel = require('./messages')
const bcrypt = require('bcrypt')
const crypto = require("crypto")
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path')
const nodemailer = require('nodemailer');
const mongoose = require('mongoose')

const SECRETKEY = 'cd82fef53829280b5c2c6f031f367b99'

router.post('/register', async function (req, res, next) {
  const { email, password, username, DOB } = req.body
  const find = await usersModel.findOne({ email })
  if (find) {
    res.send('user already exists')
  }
  else {

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new usersModel({ email, password: hashedPassword, username, DOB });
    await user.save();
    let token = jwt.sign({ email }, SECRETKEY)
    res.cookie('Token', token, {
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      secure: process.env.NODE_ENV === 'production'
    });
    res.redirect('/chat')
  }
});

router.get('/login', (req, res) => {
  res.render('login')
})
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  console.log(`User email is ${email} and paassword is ${password}`)
  try {
    const users = await usersModel.findOne({ email })
    if (!users) {
      return res.send('One or more credentials are invalid');
    }
    else {
      result = await bcrypt.compare(password, users.password)
      if (result) {
        //  const  random = crypto.randomBytes(16).toString('hex')
        let token = jwt.sign({ email }, SECRETKEY)
        res.cookie('Token', token, {
          expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          secure: process.env.NODE_ENV === 'production'
        });
        res.redirect('/chat')
      }
      else {
        res.send('One or more credentials are invalid')
      }
    }
  }
  catch (err) {
    res.send(err)
  }
})

router.get('/Logout', (req, res) => {
  res.clearCookie('Token')
  console.log("Token cleared", req.email)
  res.redirect('/login')
})

const Authentication = (req, res, next) => {
  const token = req.cookies.Token;
  if (!token) {
    res.redirect('/login')
  }
  else {
    jwt.verify(token, SECRETKEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user
      console.log('Authentication checking ' + (req.user.email));
      next()
    })
  }
}
router.get('/user/:id', async (req, res) => {
  try {
    const userid = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userid)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await usersModel.findById(userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/chat', Authentication, async (req, res) => {
  try {
    username = req.user
    const users = await usersModel.find({ email: { $ne: username.email } });
    if (users && users.length > 0) {
      const person = await usersModel.findOne({
        email: username.email
      })
      res.render('index', { name: person.username.toUpperCase(), users: users });
    } else {
      res.render('index', { name: person.username.toUpperCase(), users: [] });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('An error occurred while fetching users');
  }
});


router.post('/chat/:id', Authentication, async (req, res) => {
  try {
    const { message } = req.body;
    const r = await usersModel.findOne({ _id: req.params.id });
    if (!r) {
      return res.status(404).send({ error: 'Receiver not found' });
    }
    const receiver = r.email;

    console.log("Receiver is:", receiver);
    const senderEmail = req.user.email;
    console.log(`Sender email is ${senderEmail}`);

    if (!senderEmail) {
      return res.status(400).send({ error: 'Sender email not provided' });
    }

    const m = new messageModel({
      sender: senderEmail,
      receiver: receiver,
      message: message
    });

    await m.save();

    const user = await usersModel.findOne({ email: receiver });
    if (user && user.SocketId) {
      const update = await messageModel.findOneAndUpdate(
        { _id: m._id },
        { $set: { sent: true } },
        { new: true }
      );

      if (update) {
        console.log('Message update successful:', update);
        const io = req.app.get('io');
        io.to(user.SocketId).emit('newMessage', update);
      }
    }

    res.status(201).send({ message: 'Message sent successfully', data: m });
  } catch (error) {
    console.error('Error in /chat/:id route:', error);
    res.status(500).send({ error: 'Failed to send message', details: error.message });
  }
});

async function getChatHistory(user1, user2) {
  const messages = await messageModel.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  }).sort({ date: 1, _id: 1 }).limit(50);

  return messages;
}

router.get('/chat-history/:user', Authentication, async (req, res) => {
  const { user } = req.params;
  const u = await usersModel.findOne({ _id: user });
  const user1 = u.email
  const user2 = req.user.email;
  try {
    const chatHistory = await getChatHistory(user1, user2);
    res.json(chatHistory);
  } catch (err) {
    res.status(500).send('Error retrieving chat history');
  }
});

router.post('/img', Authentication, (req, res) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '..', 'public', 'images', 'userprofile');
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname)
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const filename = file.fieldname + '-' + uniqueSuffix + ext

      cb(null, filename)
      const imagePath = `/images/userprofile/${filename}`;

      usersModel.findOneAndUpdate(
        { email: req.user.email },
        { image: imagePath },
        { new: true }
      )
        .then(user => {
          if (!user) {
            console.error('User not found')
          }
        })
        .catch(err => {
          console.error('Error updating user:', err)
        })
    }
  })

  const upload = multer({ storage: storage })

  upload.single('image')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    res.status(200).json('Profile Photo Successfully updated')
  })
})

router.post("/otp/:email/:otp", (req, res) => {
  const { email, otp } = req.params;
  sendVerificationEmail(email, otp)
    .then(() => res.send('OTP sent successfully'))
    .catch(error => {
      console.error(error);
      res.status(500).send('Error sending OTP');
    });
});

router.get('/delete', Authentication, async (req, res) => {
  const email = req.user.email;
  try {
    const deletedUser = await usersModel.findOneAndDelete({ email: email });

    if (!deletedUser) {
      return res.status(404).send("User not found");
    }

    console.log("User deleted successfully:", email);
    res.clearCookie('Token');
    res.redirect('/login')
    res.status(200)
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send("Internal Server Error");
  }
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "zainjamshaid55@gmail.com",
    pass: "uvub lwma rpec wwqu",
  },
});

async function sendVerificationEmail(email, otp) {
  const htmlContent = `
      <p>Thank you for registering with ChatApp! We're excited to have you on board.</p>
      <p>To complete your registration, please verify your email address using the following One-Time Password (OTP):</p>
      <p style="font-size: 18px; font-weight: bold; margin: 20px 0;">Your OTP: ${otp}</p>
      <p>Please enter this OTP in the ChatApp verification page to activate your account. This OTP is valid for the next 15 minutes.</p>
      <p>If you did not sign up for a ChatApp account, please ignore this email.</p>
      <p>Thank you,<br>Zain Jamshaid</p>
    `;

  const text = `
  Thank you for registering with ChatApp! We're excited to have you on board.
  
  To complete your registration, please verify your email address using the following One-Time Password (OTP):
  
  Your OTP: ${otp}
  
  Please enter this OTP in the ChatApp verification page to activate your account. This OTP is valid for the next 15 minutes.
  
  If you did not sign up for a ChatApp account, please ignore this email.
  
  Thank you,
  Zain Jamshaid
    `

  try {
    const info = await transporter.sendMail({
      from: '"ChatApp" <zainjamshaid55@gmail.com>',
      to: email,
      subject: "Welcome to ChatApp! Verify Your Email with This OTP",
      text: text,
      html: htmlContent
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = router;
