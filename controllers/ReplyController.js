const ObjectId = require('mongodb').ObjectId;
const testString = require('./testString');

function controller(db) {

  function modReply(isDel) {
    // console.log(`Confoguring with with isDel=${isDel}`);
    return function (req, res, next) {

      // console.log(`Coming here with isDel=${isDel}`);


      if (testString(req.body.threadid)) return next(new Error('Please fill in values!'));
      if (testString(req.body.replyid)) return next(new Error('Please fill in values!'));
      if (isDel && testString(req.body.delete_password)) return next(new Error('Please fill in values!'));

      let errMsg = "";
      if (isDel) errMsg = "Incorrect password";
      else errMsg = "Reply not flagged";

      let newBoard = {};

      db.collection(process.env.DB_BOARDS)
        .find({ name: req.params.board, 'threads._id': ObjectId(req.body.threadid) })
        .toArray((err, boards) => {
          if (err) return next(err);
          let isSuccess = false;
          boards.forEach((board, i) => {
            board.threads.forEach((thread, j) => {
              thread.replies.forEach((reply, k) => {
                if (String(thread._id) === String(req.body.threadid) && String(reply._id) === String(req.body.replyid)) {
                  if (isDel) {
                    if (req.body.delete_password === reply.delete_password) {
                      reply.text = 'deleted';
                      newBoard = { ...board };
                      isSuccess = true;
                    }
                  } else {
                    reply.reported = true;
                    newBoard = { ...board };
                    isSuccess = true;
                  }
                }
              });
            });
          });

          if (isSuccess) {
            db.collection(process.env.DB_BOARDS).save(newBoard);
            return res.send('Success');
          } else {
            // return next(new Error(errMsg));
            return res.send(errMsg);
          }



        });
    }
  };

  this.markDeleted = modReply(true);
  this.flagReply = modReply(false);

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

    // console.log(req.body);
    // console.log(req.query);

    if (testString(req.body.text)) return next(new Error('Please fill in values!'));
    if (testString(req.body.delete_password)) return next(new Error('Please fill in values!'));
    if (testString(req.body.threadid)) return next(new Error('Please fill in values!'));


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
        { 'threads._id': ObjectId(req.body.threadid) },
        {
          $push: { 'threads.$.replies': { $each: [newReply], $position: 0 } },
          $set: { 'threads.$.bumped_on': curDate },
          $inc: {'threads.$.replycount':1}
        },
        {
          returnOriginal: false,
          upsert: false
        }, function (err, doc) {
          if (err) return next(err);
          if (doc.result.nModified !== 1) return next(new Error('Reply not inserted!'));
          // return res.json(doc);
          // return res.send('success');
          return res.redirect(`/b/${req.params.board}/`);
        });


  }

}

module.exports = controller;