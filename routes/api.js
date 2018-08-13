const ObjectId = require('mongodb').ObjectId;
const ThreadController = require('../controllers/ThreadController');
const ReplyController = require('../controllers/ReplyController');

function testString(str) {
  if (!str) return true;
  return (str.replace(/\s/g, "") == "");
}

module.exports = function (app, db) {

  const threadController = new ThreadController(db);
  const replyController = new ReplyController(db);

  app.route('/api/boards/:boardname')
    .post(threadController.createBoard);

  app.route('/api/threads/:board')
    .delete(threadController.deleteThread)
    .get(threadController.getTheads)
    .post(threadController.createThread)
    .put(threadController.flagThread);
    
  app.route('/api/replies/:board')
    .get(replyController.getOneThread)
    .post(replyController.createReply)
    .put(replyController.flagReply)
    .delete(replyController.markDeleted);


};
