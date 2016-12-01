'use strict';
const http = require('http');
const fs = require('fs');

const server = http.createServer(function (req, res) {
  getHandler(req)(req, res, store);
});

function getHandler (req) {
  return req.url.toLowerCase().trim().startsWith('/api') ? apiHandler : staticHandler;
}

function staticHandler (req, res, store) {
  fs.readFile(req.url.substring(1), 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function apiHandler (req, res, store) {
  const requestID = req.url.toLowerCase().trim().substring(5);
  switch (req.method) {
    case 'POST':
      if (requestID.startsWith('username:')) {
        // Post a message written by user with username given after submit
        parseJSON(req, (messageBody) => {
          let username = req.url.toLowerCase().trim().substring(14);
          if (store.postMessage(username, messageBody.message)) {
            res.writeHead(200);
            res.end('Message added');
          } else {
            res.writeHead(500);
            res.end('Could not add message');
          }
        });
      } else if (requestID.startsWith('adduser:')) {
        // Add a new user with name 'username'
        let username = requestID.substring(8).trim();
        if (store.addUser(username)) {
          res.writeHead(200);
          res.end('User created');
        } else {
          res.writeHead(500);
          res.end('A user with that name already exists');
        }
      } else if (requestID.startsWith('userlogout:')) {
        // Remove a user from the list of users by userid
        let username = requestID.substring(11).trim();
        if (store.removeUser(username)) {
          res.writeHead(200);
          res.end('User with username ' + username + ' removed');
        } else {
          res.writeHead(500);
          res.end('Could not remove user with username ' + username);
        }
      } else {
        res.writeHead(666);
        res.end('You have chosen wrong');
      }
      break;

    case 'GET':
      if (requestID.startsWith('messages')) {
        // Get all the messages from the store
        if (store.getUsers()) {
          res.writeHead(200);
          res.end(JSON.stringify(store.getMessages()));
        } else {
          res.writeHead(500);
          res.end('Something went wrong');
        }
      } else if (requestID.startsWith('users')) {
        // Get all the users from the store
        if (store.getUsers()) {
          res.writeHead(200);
          res.end(store.getUsers().toString());
        } else {
          res.writeHead(500);
          res.end('Something went wrong');
        }
      } else {
        res.writeHead(666);
        res.end('You have chosen wrong');
      }
      break;

    default:
      res.writeHead(666);
      res.end('You have chosen wrong');
  }
}

function parseJSON (req, callback) {
  var jsonString = '';

  req.on('data', function (data) {
    jsonString += data;
  });

  req.on('end', function () {
    callback(JSON.parse(jsonString));
  });
}

// Stores a list of users and a list of mesages, and provides API for accessing both
const store = {
  users: [],
  messages: [],
  // Add a user to the list of current users and return a unique id
  addUser (username) {
    let index = this.users.indexOf(username);
    if (index !== -1) {
      return false;
    } else {
      this.users.push(username);
      return true;
    }
  },

  // Remove a user from the list of users
  removeUser (username) {
    let index = this.users.indexOf(username);
    if (index === -1) {
      return false;
    } else {
      this.users.splice(this.userExists(username), 1);
      return true;
    }
  },

  // Add a message to the message array
  postMessage (username, messageBody) {
    let index = this.users.indexOf(username);
    if (index !== -1) {
      const message = {
        'user': username,
        'messageBody': messageBody
      };
      this.messages.push(message);
      console.log(this.messages);
      return true;
    } else {
      return false;
    }
  },

  // postMessage (req, requestID, res) {
  //   const message = {};
  //   parseJSON(req, (messageBody) => {
  //     message['user'] = requestID.substring(7);
  //     message['body'] = messageBody.message;
  //     this.messages.push(message);
  //     console.log(this.messages);
  //     res.end('message added');
  //   });
  // },

  getMessages (requestID, res) {
    return this.messages;
  },

  getUsers (requestID, res) {
    return this.users;
  }
};

server.listen(8000);
console.log(server.address().port);
