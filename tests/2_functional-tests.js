/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
const ObjectId = require('mongodb').ObjectId;

const threadMsgObj = require('../controllers/threadControllerMsg');

chai.use(chaiHttp);


const boardName = 'chaiTest';
const threadText = 'chaiHello';
const replyText = 'chaiHelloReply';
const threadDelPass = 'chai1234';
const replydDelPass = 'chai1234';


const idKey = '_id';
const threadKey = 'threads';
const threadUpperKeys = [idKey, threadKey];
const replyKey = 'replies';
const replyCountKey = 'replycount';
const reportedReplyKey = 'repoted';
const replyTextKey = 'text';

const threadLowerKeys = ["_id", "text", "created_on", "bumped_on", "replycount", "replies"];

var globalThreadId = undefined;
var globalReplyThreadId = undefined;
var globalReplyId = undefined;

var numReplies = 5;

const createReply = function () {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post(`/api/replies/${boardName}`)
      .type('form')
      .send({
        'text': replyText,
        'threadid': globalReplyThreadId,
        'delete_password': replydDelPass,
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        resolve('OK');
      });
  });
};

const createThread = function () {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .post(`/api/threads/${boardName}`)
      .type('form')
      .send({
        'text': threadText,
        'delete_password': threadDelPass,
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        // done();
        resolve('OK');
      });
  });
}

const listThreads = function () {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .get(`/api/threads/${boardName}`)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'body is an array');
        threadUpperKeys.forEach(elem => {
          assert.property(res.body[0], elem);
        });
        // console.log(res.body[0]);
        let threadId = res.body[0][threadKey][idKey];
        threadLowerKeys.forEach(elem => {
          assert.property(res.body[0][threadKey], elem);
        });
        assert.isArray(res.body[0][threadKey][replyKey]);
        res.body.forEach(thread => {
          // assert.isAtMost(res.body[0][threadKey][replyKey].length, 3);
          // console.log(thread);
          assert.isAtMost(thread[threadKey][replyKey].length, 3);
        });

        resolve(threadId);
        // done();
      });
  });
};

const listOneThread = function (docId, count, isDeleted = false) {
  return new Promise((resolve, reject) => {
    chai.request(server)
      .get(`/api/replies/${boardName}?threadid=${docId}`)
      .end(function (err, res) {

        assert.equal(res.status, 200);
        // console.log(res.body);
        assert.isArray(res.body, 'body is an array');
        threadUpperKeys.forEach(elem => {
          assert.property(res.body[0], elem);
        });
        // console.log(res.body[0]);

        threadLowerKeys.forEach(elem => {
          assert.property(res.body[0][threadKey], elem);
        });
        assert.isArray(res.body[0][threadKey][replyKey]);
        res.body.forEach(thread => {
          // assert.isAtMost(res.body[0][threadKey][replyKey].length, 3);
          // console.log(thread);
          assert.equal(thread[threadKey][replyKey].length, count);
          assert.equal(thread[threadKey][replyCountKey], count);
        });

        //allocate latest reply as the replyID to use
        // console.log(res.body);
        // assert.equal(res.body[0][threadKey][replyKey][0][reportedReplyKey], isFlagged);

        if (isDeleted) {
          assert.equal(res.body[0][threadKey][replyKey][0][replyTextKey], 'deleted');
        };
        let replyId = res.body[0][threadKey][replyKey][0][idKey];
        resolve(replyId);
        // done();
      });
  });
};

suite('Functional Tests', function () {


  suite('API ROUTING FOR /api/threads/:board', function () {

    //create post
    suite('POST', function () {

      test('Create board if not created', function (done) {
        chai.request(server)
          .post(`/api/boards/${boardName}`)
          .end(function (err, res) {
            if (res.status === 200) assert.equal(res.body.name, boardName);
            assert.isTrue(true);
            done();
          });
      });

      test('create thread', function (done) {
        createThread().then(res => {
          // workaround for chai
          assert.equal(true, true);
          done();
        });

      });

    });

    suite('GET', function () {
      test('List threads', function (done) {
        listThreads().then(res => {
          assert.equal(true, true);
          // console.log(res);
          globalThreadId = res;
          done();
        });
      });

    });



    suite('PUT', function () {

      test('flag thread', function (done) {
        chai.request(server)
          .put(`/api/threads/${boardName}`)
          .type('form')
          .send({
            'report_id': globalThreadId,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.sucessMsg);
            done();
          });
      });

      test('flag thread again and expect fail', function (done) {
        chai.request(server)
          .put(`/api/threads/${boardName}`)
          .type('form')
          .send({
            'report_id': globalThreadId,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.notFlaggedMsg);
            done();
          });
      });


    });

    suite('DELETE', function () {

      test('delete thread with incorrect password', function (done) {
        chai.request(server)
          .delete(`/api/threads/${boardName}`)
          .type('form')
          .send({
            'threadid': globalThreadId,
            'delete_password': threadDelPass + 'garbage',
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.invalidPassMsg);
            done();
          });
      });

      test('delete thread with correct password', function (done) {
        chai.request(server)
          .delete(`/api/threads/${boardName}`)
          .type('form')
          .send({
            'threadid': globalThreadId,
            'delete_password': threadDelPass,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.sucessMsg);
            done();
          });
      });

    });

  });

  suite('API ROUTING FOR /api/replies/:board', function () {

    suite('POST and GET', function () {



      test('create thread specifically for replies', function (done) {
        createThread().then(res => {
          // workaround for chai
          assert.equal(true, true);
          done();
        });
      });

      test('Get thread ID for replies', function (done) {
        listThreads().then(res => {
          assert.equal(true, true);
          // console.log(res);
          globalReplyThreadId = res;
          done();
        });
      });

      test(`create ${numReplies} replies for thread`, function (done) {
        let iArr = [];
        for (i = 0; i < numReplies; i++) iArr.push(i);

        Promise.all(iArr.map(i => {
          return createReply();
        })).then(res => {
          assert.equal(true, true);
          done();
        });
      });

      test('Ensure all threads only list 3 replies', function (done) {
        listThreads().then(res => {
          assert.equal(true, true);
          // console.log(res);
          // globalThreadId = res;
          done();
        });
      });

      test(`Ensure single thread list all ${numReplies} replies, get replyID`, function (done) {
        listOneThread(globalReplyThreadId, numReplies).then(res => {
          assert.equal(true, true);
          globalReplyId = res;
          // console.log(globalReplyId);
          done();
        });
      });

    });


    suite('PUT', function () {
      test('Flag reply', function (done) {
        chai.request(server)
          .put(`/api/replies/${boardName}`)
          .type('form')
          .send({
            'threadid': globalReplyThreadId,
            'replyid': globalReplyId,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.sucessMsg);
            done();
          });
      });

    });

    suite('DELETE', function () {
      test('delete reply', function (done) {
        chai.request(server)
          .delete(`/api/replies/${boardName}`)
          .type('form')
          .send({
            'threadid': globalReplyThreadId,
            'replyid': globalReplyId,
            'delete_password': replydDelPass,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.sucessMsg);
            done();
          });
      });

      test('check reply was deleted', function (done) {
        listOneThread(globalReplyThreadId, numReplies, true).then(res => {
          assert.equal(true, true);
          // globalReplyId = res;
          // console.log(globalReplyId);
          done();
        });
      });

    });

  });

});
