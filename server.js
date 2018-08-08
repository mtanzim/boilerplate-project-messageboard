require('dotenv').load();

var express = require('express');
var bodyParser = require('body-parser');
// var expect = require('chai').expect;
var cors = require('cors');
const helmet = require('helmet');
const mongo = require('mongodb').MongoClient;


var apiRoutes = require('./routes/api.js');
var fccTestingRoutes = require('./routes/fcctesting.js');
var runner = require('./test-runner');

var app = express();

app.use(helmet.frameguard({
  action: 'deny'
}));
app.use(helmet.dnsPrefetchControl());

// security reqs
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'cdn.gomix.com'],
    imgSrc: ["'self'", 'cdn.gomix.com'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      'code.jquery.com'
    ],
  }
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });


mongo.connect(process.env.DB, (err, client) => {

  let db = client.db(process.env.DB_NAME);

  if (err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');

    // create unique index for boards name
    db.collection(process.env.DB_BOARDS)
      .createIndex({"name":1},{unique:true});


    //For FCC testing purposes
    fccTestingRoutes(app, db);

    //Routing for API 
    apiRoutes(app, db);

    //404 Not Found Middleware
    app.use(function (req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });

    // error handling middleware
    app.use((err, req, res) => {
      if (process.env.NODE_ENV === 'dev') {
        console.log(err.stack);
        console.log(`Server error: ${err.message}`);
      }
    });
    //Start our server and tests!
    app.listen(process.env.PORT || 3000, function () {
      console.log("Listening on port " + process.env.PORT);
      if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            var error = e;
            console.log('Tests are not valid:');
            console.log(error);
          }
        }, 1500);
      }
    });

  }
});

module.exports = app; //for testing