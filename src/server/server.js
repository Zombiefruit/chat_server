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
      if (requestID.startsWith('userid')) {
        // Post a message written by user with userid
        store.postMessage(req, requestID, res);
      } else if (requestID.startsWith('username')) {
        // Add a new user with name 'username'
        store.addUser(requestID, res);
      } else if (requestID.startsWith('userlogout')) {
        // Remove a user from the list of users by userid
        store.removeUser(requestID, res);
      } else {
        res.writeHead(666);
        res.end('You have chosen wrong');
      }
      break;

    case 'GET':
      if (requestID.startsWith('messages')) {
        store.getMessages(requestID, res);
      } else if (requestID.startsWith('users')) {
        store.getUsers(requestID, res);
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

const store = {
  users: [],
  messages: [],
  // Add a user to the list of current users and return a unique id
  addUser (requestID, res) {
    const username = requestID.substring(9);
    this.users.push(username);
    res.end("it's working");
  },

  // Remove a user from the list of users
  removeUser (requestID, res) {
    const index = this.users.indexOf(requestID.substring(11));
    if (~index) {
      this.users.splice(index, 1);
    }
    res.end('should be removed');
  },

  postMessage (req, requestID, res) {
    const message = {};
    parseJSON(req, (messageBody) => {
      message['user'] = requestID.substring(7);
      message['body'] = messageBody.message;
      this.messages.push(message);
      console.log(this.messages);
      res.end('message added');
    });
  },

  getMessages (requestID, res) {
    return this.messages;
  },

  getUsers (requestID, res) {
    return this.users;
  }
};

server.listen(8000);
console.log(server.address().port);
