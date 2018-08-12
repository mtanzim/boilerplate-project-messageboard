const ObjectId = require('mongodb').ObjectId;
const testString = require('./testString');


function controller(db) {

  this.flagReply = (req, res, next) => {

    if (testString(req.query.threadid)) return next(new Error('Please fill in values!'));
    if (testString(req.query.replyid)) return next(new Error('Please fill in values!'));

    // console.log(req.query);

    db.collection(process.env.DB_BOARDS)
      .find({ name: req.params.board, 'threads._id': ObjectId(req.query.threadid) })
      .toArray((err, boards) => {
        // return res.json(threads);
        if (err) return next(err);
        boards.forEach((board,i) => {
          // console.log(board);
          board.threads.forEach((thread,j) => {
            thread.replies.forEach((reply,k) => {
              // console.log(thread._id);
              // console.log(reply._id);
              // console.log(req.query.threadid);
              // console.log(req.query.replyid);
              // console.log(reply);
              // if (ObjectId(thread._id) === ObjectId(req.query.threadid) && reply._id === req.query.replyid) {
              if (String(thread._id) === String(req.query.threadid) && String(reply._id) === String(req.query.replyid)  ) {
                reply.reported = true;
                // boards[i].threads[j].replies[k].reported = true;
                db.collection(process.env.DB_BOARDS).save(board);
                return res.send('Success');
                // console.log('Hi');
              } else {
                return next (new Error('Reply not flagged'));
              }

            });
          });
        });

        // return res.json(boards);
      });
  };

  this.getOneThread = (req, res, next) => {
    db.collection(process.env.DB_BOARDS).aggregate([
      { $unwind: '$threads' },
      { $match: { 'threads._id': ObjectId(req.query.threadid) } },
      {
        $project: {
          threads: {
            '_id': 1,
            replies: {
              '_id': 1,
              'text': 1,
              'created_on': 1,
            },
            'text': 1,
            'created_on': 1,
            'bumped_on': 1,
          },
        }
      },
    ]).toArray((err, doc) => {
      if (err) return next(err);
      return res.json(doc);
    });

  }

  this.createReply = (req, res, next) => {

    if (testString(req.body.text)) return next(new Error('Please fill in values!'));
    if (testString(req.body.delete_password)) return next(new Error('Please fill in values!'));
    if (testString(req.query.threadid)) return next(new Error('Please fill in values!'));


    let curDate = new Date();
    let newReply = {
      _id: new ObjectId(),
      text: req.body.text,
      delete_password: req.body.delete_password,
      reported: false,
      created_on: curDate,
      // replies: [],
    };

    db.collection(process.env.DB_BOARDS)
      .update(
        { 'threads._id': ObjectId(req.query.threadid) },
        {
          $push: { 'threads.$.replies': { $each: [newReply], $position: 0 } },
          $set: { 'threads.$.bumped_on': curDate }
        },
        {
          returnOriginal: false,
          upsert: false
        }, function (err, doc) {
          if (err) return next(err);
          if (doc.result.nModified !== 1) return next(new Error('Reply not inserted!'));
          return res.json(doc);
        });


  }

}

module.exports = controller;