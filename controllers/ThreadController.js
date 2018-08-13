const ObjectId = require('mongodb').ObjectId;
const testString = require('./testString');


function controller(db) {

  this.flagThread = (req, res, next) => {

    console.log(req.body);

    if (testString(req.body.report_id)) return next(new Error('Please fill in values!'));

    db.collection(process.env.DB_BOARDS)
      .update(
        { name: req.params.board, 'threads._id': ObjectId(req.body.report_id) },
        { $set: { 'threads.$.reported': true } },
        {
          returnOriginal: false,
          upsert: false
        }, function (err, doc) {
          if (err) return next(err);
          // if (doc.result.nModified !== 1) return next(new Error('Thread not flagged!'));
          if (doc.result.nModified !== 1) return res.send('Thread not flagged!');
          return res.send('success');
        });
  };


  this.createBoard = (req, res, next) => {
    db.collection(process.env.DB_BOARDS)
      .insert({
        name: req.params.boardname,
        threads: [],
        created_on: new Date(),
        updated_on: new Date(),
      }, (err, doc) => {
        if (err) return next(err);
        if (!doc.result.ok || doc.result.n !== 1 || !doc.ops[0]) return next(new Error('Document insert error'));
        return res.json(doc.ops[0]);
      });
  };

  this.createThread = (req, res, next) => {

    if (testString(req.body.text)) return next(new Error('Please fill in values!'));
    if (testString(req.body.delete_password)) return next(new Error('Please fill in values!'));

    let newThread = {
      _id: new ObjectId(),
      text: req.body.text,
      delete_password: req.body.delete_password,
      reported: false,
      created_on: new Date(),
      bumped_on: new Date(),
      replies: [],
      replycount: 0,
    };

    db.collection(process.env.DB_BOARDS)
      .update({ name: req.params.board }, { $push: { threads: { $each: [newThread], $position: 0 } } }, {
        returnOriginal: false,
        upsert: false
      }, function (err, doc) {
        if (err) return next(err);
        if (doc.result.nModified !== 1) return next(new Error('Thread not inserted!'));
        return res.redirect(`/b/${req.params.board}/`);
      });
  };

  this.deleteThread = (req, res, next) => {

    if (testString(req.body.threadid)) return next(new Error('Incorrect password!'));
    if (testString(req.body.delete_password)) return next(new Error('Incorrect password!'));
    db.collection(process.env.DB_BOARDS)
      .update({ name: req.params.board }, {
        $pull: {
          'threads': {
            '_id': ObjectId(req.body.threadid),
            'delete_password': req.body.delete_password
          }
        }
      }, {
          multi: false,
        }, function (err, doc) {
          if (err) return next(err);
          // console.log(doc.result);
          // if (doc.result.nModified !== 1) return next(new Error('Incorrect password!'));
          if (doc.result.nModified !== 1) return res.send('Incorrect password!');
          return res.send('success');
        });
  };

  this.getTheads = (req, res, next) => {
    db.collection(process.env.DB_BOARDS).aggregate([
      { $match: { name: req.params.board } },
      { $unwind: '$threads' },
      {
        $sort: {
          'threads.bumped_on': -1,
        }
      },
      { $limit: 10 },
      {
        $project: {
          // 'threads.reples.delete_password': 1,
          threads: {
            '_id': 1,
            'replycount': 1,
            'replies': { 
              $slice: ["$threads.replies", 3],
            },
            'text': 1,
            'created_on': 1,
            'bumped_on': 1,
          },
        }
      },
    ]).toArray((err, doc) => {
      // remove sensetive fields
      doc.forEach(thread => {
         thread.threads.replies.forEach(reply => {
          reply.reported = undefined;
          reply.delete_password = undefined;
         });
      });
      if (err) return next(err);
      return res.json(doc);
    });

  };

}

module.exports = controller;