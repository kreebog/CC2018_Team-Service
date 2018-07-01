"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const util_1 = require("util");
const mongodb_1 = require("mongodb");
const express_1 = __importDefault(require("express"));
const cc2018_ts_lib_1 = require("cc2018-ts-lib");
// constant value references
const DB_URL = 'mongodb+srv://mdbuser:cc2018-mdbpw@cluster0-bxvkt.mongodb.net/';
const DB_NAME = 'cc2018';
const COL_NAME = 'teams';
const SVC_PORT = process.env.TEAM_SVC_PORT || 8080;
const ENV = process.env['NODE_ENV'] || 'PROD';
const SVC_NAME = 'session-service';
// set the logging level based on current env
const log = cc2018_ts_lib_1.Logger.getInstance();
log.setLogLevel(parseInt(process.env['LOG_LEVEL'] || '3')); // defaults to "INFO"
log.info(__filename, SVC_NAME, 'Starting service with environment settings for: ' + ENV);
// create the express app reference
const app = express_1.default();
let httpServer; // will be set with app.listen
let mongoDBClient; // set on successful connection to db
// configure pug
app.set('views', 'views');
app.set('view engine', 'pug');
// connect to the database first
log.info(__filename, SVC_NAME, 'Connecting to MongoDB: ' + DB_URL);
mongodb_1.MongoClient.connect(DB_URL, (err, client) => {
    if (err) {
        log.error(__filename, util_1.format('MongoClient.connect(%s)', DB_URL), 'Error connecting to MongoDB: ' + err.message);
        return err;
    }
    let db = client.db(DB_NAME);
    let col = db.collection(COL_NAME);
    mongoDBClient = client;
    // so far so good - let's start the service
    httpServer = app.listen(SVC_PORT, function () {
        log.info(__filename, SVC_NAME, 'Listening on port ' + SVC_PORT);
        // general /get route returns all teams
        app.get('/get', (req, res) => {
            // finds all teams, but only returns basic maze key information
            col.find({}).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, JSON.stringify(err));
                    return res.status(500).json({ 'status': util_1.format('Error finding getting teams from %s: %s', COL_NAME, err.message) });
                }
                // if no match found, generate a new maze from the given values
                if (docs.length == 0) {
                    log.debug(__filename, req.path, util_1.format('No teams found in collection %s', COL_NAME));
                    res.status(404).json({ 'status': util_1.format('No teams found in collectoin %s', COL_NAME) });
                }
                else {
                    // match was found in the database return it as json
                    log.debug(__filename, req.path, util_1.format('%d teams found in %s, returning JSON ...', docs.length, COL_NAME));
                    // send the json data
                    res.status(200).json(docs);
                }
            });
        });
        // insert team into database 
        app.get('/get/:teamId', (req, res) => {
            let teamId = req.params.teamId;
            // search the collection for a maze with the right id
            col.find({ teamId: teamId }).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, JSON.stringify(err));
                    return res.status(500).json({ 'status': util_1.format('Error finding %s in %s: %s', teamId, COL_NAME, err.message) });
                }
                if (docs.length > 0) {
                    return res.status(200).json(docs[0]);
                }
                else {
                    res.status(404).json({ 'status': util_1.format('No teams with id %s found in collectoin %s', teamId, COL_NAME) });
                }
            });
        });
        // now handle routes with express
        app.get('/*', (req, res) => {
            log.debug(__filename, req.path, 'Invalid path in URL.');
            res.setHeader('Content-Type', 'text/html');
            res.render('index', {
                contentType: 'text/html',
                responseCode: 404,
                sampleGetAll: util_1.format('http://%s/get', req.headers.host),
                sampleGet: util_1.format('http://%s/get/1', req.headers.host),
            });
        }); // route: /
    }); // app.listen...
}); // MongoClient.conect...
/**
 * Watch for SIGINT (process interrupt signal) and trigger shutdown
 */
process.on('SIGINT', function onSigInt() {
    // all done, close the db connection
    log.info(__filename, 'onSigInt()', 'Got SIGINT - Exiting applicaton...');
    doShutdown();
});
/**
 * Watch for SIGTERM (process terminate signal) and trigger shutdown
 */
process.on('SIGTERM', function onSigTerm() {
    // all done, close the db connection
    log.info(__filename, 'onSigTerm()', 'Got SIGTERM - Exiting applicaton...');
    doShutdown();
});
/**
 * Gracefully shut down the service
 */
function doShutdown() {
    log.info(__filename, 'doShutDown()', 'Closing HTTP Server connections...');
    httpServer.close();
    log.info(__filename, 'doShutDown()', 'Closing Database connections...');
    mongoDBClient.close();
}
//# sourceMappingURL=service.js.map