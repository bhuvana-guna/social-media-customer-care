
const MongoClient = require('mongodb').MongoClient;
var config = require('./../config.js');
var q = require('q');

var database;

const uri = config.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
    if (err) {
        console.error('Unable to connect to the mongoDB server. Error:', err);
    } else {
        console.log('Connection established to: ' + uri);
        database = client.db(config.DB_NAME);
    }
});

module.exports = {
    insertRecord: function(record, table) {
        console.log('Requested to insert: ' + JSON.stringify(record) + " in collection - " + table);
        // Get the documents collection
        var collection = database.collection(table);
        var insertResult = {
            error: false
        }
        var deferred = q.defer();

        // Insert user record into the collection as new document
        collection.insert(record, function(err, result) {
            if (err) {
                console.error(err);
                insertResult.error = true;
                deferred.reject(insertResult);
            } else {
                console.log('Inserted document into the "'+ table +'" collection. The documents inserted with "_id" are:', JSON.stringify(result));
                insertResult.error = false;
                insertResult.message = result;
                deferred.resolve(insertResult);
            }
        });
        console.log('Exiting insertRecord method');
        return deferred.promise;
    },

    // To get records of the sender using senderID
    getRecords: function(condition, table) {
        console.log('Requested : ' + condition + " from collection: " + table);

        var deferred = q.defer();

        // Get the documents collection
        var collection = database.collection(table);
        collection.find(condition).toArray(function(err, result) {
            var response = {};
            if (err) {
                console.log(err);
                response.error = true;
                response.errorObject = err;
                deferred.reject(response);
            } else if (result.length) {
                // console.log('Found:', result);
                response.error = false;
                response.record = result;
                deferred.resolve(response);
            } else {
                response.error = false;
                response.record = [];
                console.log('No document(s) found with defined "find" criteria!');
                deferred.resolve(response);
            }
        });

        return deferred.promise;
    },
    getAllRecords: function(table) {
        console.log("Requested all the records from collection: " + table);

        var deferred = q.defer();

        // Get the documents collection
        var collection = database.collection(table);
        collection.find().toArray(function(err, result) {
            var response = {};
            if (err) {
                console.log(err);
                response.error = true;
                response.errorObject = err;
                deferred.reject(response);
            } else if (result.length) {
                // console.log('Found:', result);
                response.error = false;
                response.record = result;
                deferred.resolve(response);
            } else {
                response.error = false;
                response.record = [];
                console.log('No document(s) found with defined "find" criteria!');
                deferred.resolve(response);
            }
        });

        return deferred.promise;
    },

    updateRecord: function(query, record, table) {

        var collection = database.collection(table);
        var deferred = q.defer();

        collection.updateOne(query, record, {
        }, table).then(function(response) {
            console.log('In databaseutils:updateRecord - success callback');
            console.log(response);
            var result = {
                'success': true,
                'recordsModified': response.nModified
            }
            deferred.resolve(result);
        }, function(error) {
            console.log('In databaseutils:updateRecord - error callback');
            console.log(error);
            var result = {
                'success': false,
                'errorMessage': 'Data insert failed in DB'
            }
            deferred.reject(result);
        });
        console.log('Exiting databaseutils:updateRecord');
        return deferred.promise;
    },
}
