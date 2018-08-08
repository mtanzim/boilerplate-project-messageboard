const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, db) {
  
  app.route('/api/boards/:boardname')
    .post((req, res, next) => {
      // res.send(req.params.boardname);



      db.collection(process.env.DB_BOARDS)
        .insert({
          name:req.params.boardname,
          threads:[],
          created_on: new Date(),
          bumped_on: new Date(),
        }, (err, doc) => {
          if (err) return next(err);
          if (!doc.result.ok || doc.result.n !== 1 || !doc.ops[0]) return next(new Error('Document insert error'));
          return res.json(doc.ops[0]);
        }); 

    });
  app.route('/api/threads/:board')
    .get ((req, res, next) => {



      db.collection(process.env.DB_BOARDS)
        .find({name:req.params.board})
        .sort([['updated_on', -1]])
        // .project({ 'comments': 0 })
        .toArray((err, doc) => {
          if (err) return next(err);
          return res.json(doc);
        });

    })
    .post ((req, res, next) => {

      let newThread ={
        _id: new ObjectId(),
        text: req.body.text,
        delete_password: req.body.delete_password,
        reported: false,
        created_on: new Date(),
        bumped_on: new Date(),
        replies: [],
      };

      db.collection(process.env.DB_BOARDS)
        .findOneAndUpdate({ name: req.params.board }, { $push: { threads: newThread } }, {
          returnOriginal: false,
          upsert: false
        }, function (err, doc) {
          if (err) return next(err);
          if (!doc.value) return next(new Error('Thread not inserted!'));
          return res.json(doc);
        });
      // res.send("OK");
    })

    .put ((req, res, next) => {
      res.send("OK");
    })
    .delete ((req, res, next) => {
      res.send("OK");
    })
    
  app.route('/api/replies/:board');

};
