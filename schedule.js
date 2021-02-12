require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/user');
const participants = require('./models/participants');
const bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.json());
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true});
const db = mongoose.connection
db.on('error',(error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

async function getMeetingBIid(req, res, next) {
    let user;
    try {
      user = await User.findById(req.params.id);
      if (user == null) {
        return res.status(404).json({ message: 'Cannot find subscriber' })
      }
    } catch (err) {
      return res.status(500).json({ message: err.message })
    }
  
    res.user = user;
    next();
  }

app.get('/meetings/:id', getMeetingBIid, (req, res) => {
    res.json(res.user);
  });


app.get('/meetings', async (req, res) => {
    try {
      const user = await User.find();
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

function paginatedResults(model,page1,limit1) {
      const page = parseInt(page1);
      const limit = parseInt(limit1);
  
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
  
      const results = {}

      if (endIndex < model.length) {
        results.next = {
          page: page + 1,
          limit: limit
        }
      }
      
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit
        }
      }
     results.results = model.slice(startIndex,endIndex);
     return results;
}

app.get('/meetings?start=:start&end=:end&page=:page&limit=:limit', async(req,res) => {
    try {
        const users = await User.find();
        var userArray=[]
        userArray = getMeetingByTime(users,req.params.start,req.params.end)
        userArray = paginatedResults(userArray,req.params.page,req.params.limit);
        res.json(userArray);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
});

function getMeetingByEmail(meetArray,meetingsByMails,email) 
{
        meetArray.forEach(user => {
            var partArray = user.participants;
            partArray.forEach(parti => {
                if(parti.email == email)
                meetingsByMails.push(user);
            });
        });     
      return meetingsByMails;
}

function getMeetingByTime(meetArray,start,end) 
{
        var userArray=[];
        meetArray.forEach(user => {
            if(new Date(user.startDate).getTime() >= new Date(start).getTime() && new Date(user.endDate).getTime() <= new Date(end).getTime())
                userArray.push(user);
        });       
      return userArray;
}

app.get('/meetings?email=:email&page=:page&limit=:limit', async(req,res) => {
    try {
        const users = await User.find();
        var userArray=[]
        userArray = getMeetingByEmail(users,userArray,req.params.email);
        userArray = paginatedResults(userArray,req.params.page,req.params.limit);
        res.json(userArray);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
});

app.post('/meetings', async (req, res) => {
    let participantsArray = req.body.participants;
    var partAddArray = [];
    var meetingsByMails =[];
    var meetings = []; 
    try {
        meetings = await User.find();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
      }
    
    var meetingsByTime = getMeetingByTime(meetings,req.body.startDate,req.body.endDate);
         participantsArray.forEach(participant => {
            var parti = new participants(
                {
                    name:participant.name,
                    email:participant.email
                }
            );
            parti.save()
            meetingsByMails = getMeetingByEmail(meetingsByTime,meetingsByMails,participant.email);
            partAddArray.push(parti);
        });
    console.log(meetingsByMails);

    if(meetingsByMails.length == 0)
    {    
        const user = new User({
          title: req.body.title,
          participants: partAddArray,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          timestamp: req.body.timestamp
            })
        try {
          const newUser = await user.save();
          res.status(201).json(newUser);
        } catch (err) {
          res.status(400).json({ message: err.message })
        }
    }
    else
    res.status(401).json({ message: 'Time slot already booked' })
  });

app.listen(3000, () => console.log('Server Started'));