# FreeCodeCamp Information Security and Quality Assurance

Project Anon Message Board - Tanzim's Fork

1) SET NODE_ENV to `test` without quotes when ready to write tests and DB to your databases connection string (in .env)
2) Recomended to create controllers/handlers and handle routing in routes/api.js
3) You will add any security features to `server.js`
4) You will create all of the functional/unit tests in `tests/2_functional-tests.js` and `tests/1_unit-tests.js` but only functional will be tested

## Lessons Learned/Comments

- Using [object modules](./controllers/ThreadController.js) in [routes](./routes/api.js)
- Limitations of subdocument arrays and objects ($limt, $slice $project etc.)
  - TLDR: Don't use nesting beyond one level, use Mongoose, or use JS functions on doc array
  - <https://pythonolyk.wordpress.com/2016/01/17/mongodb-update-nested-array-using-positional-operator/>
- MongoDB Nested Array Operations
  - <https://docs.mongodb.com/manual/reference/operator/update/positional-all/#position-nested-arrays>
- MongoDB Array Operations
  - <https://stackoverflow.com/questions/24113979/how-to-add-a-sub-document-to-sub-document-array-in-mongodb>
- MongoDB Aggregations
  - <https://docs.mongodb.com/manual/aggregation/>
  - <https://stackoverflow.com/questions/13449874/how-to-sort-array-inside-collection-record-in-mongodb>
- Is it better to create related collections, or embed mutiple layers in documents? Research further.
  - <https://stackoverflow.com/questions/5373198/mongodb-relationships-embed-or-reference>
  - <https://coderwall.com/p/px3c7g/mongodb-schema-design-embedded-vs-references>