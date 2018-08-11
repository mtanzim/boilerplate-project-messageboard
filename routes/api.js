const ObjectId = require('mongodb').ObjectId;

function testString(str) {
  if (!str) return true;
  return (str.replace(/\s/g, "") == "");
}

module.exports = function (app, db) {

  app.route('/api/boards/:boardname')
    .post((req, res, next) => {
      // res.send(req.params.boardname);
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

    });
  app.route('/api/threads/:board')
    .get((req, res, next) => {
      db.collection(process.env.DB_BOARDS).aggregate([
        { $match: { name: req.params.board } },
        { $unwind: '$threads' },
        {
          $sort: {
            'threads.bumped_on': -1,
            // 'threads.replies.created_on':-1,
          }
        },
        { $limit: 10 },
        {
          $project: {
            threads: {
              '_id': 1,
              'replies': { $slice: ["$threads.replies.text", 3] },
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

    })
    .post((req, res, next) => {

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
      };

      db.collection(process.env.DB_BOARDS)
        .findOneAndUpdate({ name: req.params.board }, { $push: { threads: { $each: [newThread], $position: 0 } } }, {
          returnOriginal: false,
          upsert: false
        }, function (err, doc) {
          if (err) return next(err);
          if (!doc.value) return next(new Error('Thread not inserted!'));
          return res.json(doc);
        });
      // res.send("OK");
    })

    .put((req, res, next) => {
      res.send("OK");
    })
    .delete((req, res, next) => {
      res.send("OK");
    })

  app.route('/api/replies/:board')
    .get((req, res, next) => {
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

    })
    .post((req, res, next) => {

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
        .findOneAndUpdate(
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
            if (!doc.value) return next(new Error('Reply not inserted!'));
            return res.json(doc.value);
          });


    });


};
