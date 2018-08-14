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
const threadDelPass = 'chai1234';

const threadUpperKeys = ['_id', 'threads'];
const idKey = '_id';
const threadKey = 'threads';
const replyKey = 'replies';
const threadLowerKeys = ["_id", "text", "created_on", "bumped_on", "replycount", "replies"];

var threadId=undefined;


const resSuccessMsg = 'success';

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
        chai.request(server)
          .post(`/api/threads/${boardName}`)
          .type('form')
          .send({
            'text': threadText,
            'delete_password': threadDelPass,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });

    });

    suite('GET', function () {
      test('List threads', function (done) {
        chai.request(server)
          .get(`/api/threads/${boardName}`)
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'body is an array');
            threadUpperKeys.forEach ( elem => {
              assert.property(res.body[0], elem);
            });
            threadId = res.body[0][idKey];
            threadLowerKeys.forEach ( elem => {
              assert.property(res.body[0][threadKey], elem);
            });
            assert.isArray(res.body[0][threadKey][replyKey])
            assert.isAtMost(res.body[0][threadKey][replyKey].length, 3)
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
            'threadid': threadId,
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
            'threadid': threadId,
            'delete_password': threadDelPass,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, threadMsgObj.sucessMsg);
            done();
          });
      });

    });

    suite('PUT', function () {

    });


  });

  suite('API ROUTING FOR /api/replies/:board', function () {

    suite('POST', function () {

    });

    suite('GET', function () {

    });

    suite('PUT', function () {

    });

    suite('DELETE', function () {

    });

  });

});
