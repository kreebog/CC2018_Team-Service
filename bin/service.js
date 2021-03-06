"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
let bodyParser = require('body-parser');
const fs_1 = __importDefault(require("fs"));
const v4_1 = __importDefault(require("uuid/v4"));
const url_1 = __importDefault(require("url"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const mongodb_1 = require("mongodb");
const express_1 = __importDefault(require("express"));
const cc2018_ts_lib_1 = require("cc2018-ts-lib");
// constant value references
const DB_URL = util_1.format('%s://%s:%s@%s/', process.env['DB_PROTOCOL'], process.env['DB_USER'], process.env['DB_USERPW'], process.env['DB_URL']);
const DB_NAME = 'cc2018';
const COL_NAME = 'teams';
const SVC_PORT = process.env.TEAM_SVC_PORT || 8080;
const ENV = process.env['NODE_ENV'] || 'PROD';
const SVC_NAME = 'team-service';
const DELETE_PASSWORD = process.env.DELETE_PASSWORD;
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
        // allow CORS for this application
        app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        // parse incoming request bodies as JSON
        app.use(bodyParser.json());
        // Renders functional list of team data
        app.get('/list', (req, res) => {
            col.find({}).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, err.toString());
                    res.status(500).json({
                        status: util_1.format('Error getting Teams from %s.%s: %s', DB_NAME, COL_NAME, err.toString())
                    });
                }
                else {
                    res.render('list', { teams: docs });
                }
            });
        });
        // general /get route returns all teams
        app.get('/get', (req, res) => {
            // finds all teams, but only returns basic maze key information
            col.find({}).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, JSON.stringify(err));
                    return res.status(500).json({ status: util_1.format('Error finding getting teams from %s: %s', COL_NAME, err.message) });
                }
                // if no match found, generate a new maze from the given values
                if (docs.length == 0) {
                    log.debug(__filename, req.path, util_1.format('No teams found in collection %s', COL_NAME));
                    res.status(404).json({ status: util_1.format('No teams found in collection %s', COL_NAME) });
                }
                else {
                    // match was found in the database return it as json
                    log.debug(__filename, req.path, util_1.format('%d teams found in %s, returning JSON ...', docs.length, COL_NAME));
                    // send the json data
                    res.json(docs);
                }
            });
        });
        // delete a team from database
        app.get('/delete/:teamId/:password', (req, res) => {
            let teamId = req.params.teamId + '';
            // PASSWORD FOR DELETES FOUND IN ENVIRONMENT VARIABLES
            if (DELETE_PASSWORD != req.params.password)
                return res.status(401).json({ status: 'Missing or incorrect password.' });
            // search the collection for a maze with the right id
            col.deleteOne({ id: teamId }, (err, results) => {
                if (err) {
                    log.error(__filename, req.path, JSON.stringify(err));
                    return res.status(500).json({ status: util_1.format('Error deleting %s from %s: %s', teamId, COL_NAME, err.message) });
                }
                // send the result code with deleted doc count
                res.json({ status: 'ok', count: results.deletedCount });
                log.info(__filename, req.path, util_1.format('%d document(s) deleted', results.deletedCount));
            });
        });
        // insert team into database
        app.get('/get/:teamId', (req, res) => {
            let teamId = req.params.teamId + '';
            // search the collection for a maze with the right id
            col.find({ id: teamId }).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, err.toString());
                    return res.status(500).json({ status: util_1.format('Error finding %s in %s: %s', teamId, COL_NAME, err.toString()) });
                }
                if (docs.length > 0) {
                    return res.json(docs[0]);
                }
                else {
                    res.status(404).json({
                        status: util_1.format('No teams with id %s found in collection %s', teamId, COL_NAME)
                    });
                }
            });
        });
        // add a new team to the database
        app.get('/add', (req, res) => {
            let team = { id: v4_1.default(), name: '', logo: 'unknown_logo_150.png', bots: new Array(), trophies: new Array() };
            let urlParts = url_1.default.parse(req.url, true);
            let query = urlParts.query;
            // make sure there's some work to be done...
            if (Object.keys(urlParts.query).length == 0) {
                log.debug(__filename, req.path, 'No arguments in query string, aborting update.');
                return res.status(400).json({ status: 'Invalid request: No arguments in query string.' });
            }
            if (urlParts.query['name'] === undefined) {
                let msg = 'Invalid request - Name is required: /add?name=TeamName';
                log.debug(__filename, req.path, 'Name parameter is required: /add?name=TeamName');
                return res.status(400).json({ status: msg });
            }
            if (urlParts.query['logo'] === undefined) {
                let msg = 'Invalid request - Logo is required: /add?logo=FileName.  Available logos: [fire|skull|sun|tree|water|unknown]_logo_150.png';
                log.debug(__filename, req.path, msg);
                return res.status(400).json({ status: msg });
            }
            if (!req.url.match(/bot[0-9]-name/g)) {
                let msg = 'Invalid request - At least one bot is required: /add?team=TeamName&bot1-name=BotName';
                log.debug(__filename, req.path, msg);
                return res.status(400).json({ status: msg });
            }
            // set team name and logo
            team.name = query['name'] + '';
            team.logo = query['logo'] + '';
            // add the bots
            for (let x = 0; x < 5; x++) {
                let nameKey = util_1.format('bot%d-name', x + 1);
                let coderKey = util_1.format('bot%d-coder', x + 1);
                let weightKey = util_1.format('bot%d-weight', x + 1);
                let bot = { id: '', name: '', weight: 0, coder: '' };
                // update / set bot name if found
                if (query[nameKey] !== undefined)
                    bot.name = query[nameKey] + '';
                // update / set bot name if found
                if (query[coderKey] !== undefined)
                    bot.coder = query[coderKey] + '';
                // update / set bot weight if found
                if (query[weightKey] !== undefined)
                    bot.weight = parseInt(query[weightKey] + '');
                // add the bot to the team
                bot.id = v4_1.default();
                team.bots.push(bot);
            }
            // insert the record into the database
            col.insert(team);
            // return success
            res.json({ status: util_1.format('Team [%s] (%s) added.', team.name, team.id) });
        });
        // just shove a whole score from request body into the database all at once
        app.put('/team', (req, res) => {
            let team = req.body;
            col.update({ id: team.id }, team);
            log.debug(__filename, req.url, util_1.format('Team updated: ', req.body));
        });
        /**
         * Update an existing team in the database.
         * http:localhost:8083/update/1?name=TeamName&bot[1-5]-name=BotOne&bot[1-5]-weight=100&...<more bots>
         */
        app.get('/update/:teamId', (req, res) => {
            let teamId = req.params.teamId + '';
            let urlParts = url_1.default.parse(req.url, true);
            // search the collection for a maze with the right id
            col.find({ id: teamId }).toArray((err, docs) => {
                if (err) {
                    log.error(__filename, req.path, err.toString());
                    return res.status(500).json({ status: util_1.format('Error finding %s in %s: %s', teamId, COL_NAME, err.toString()) });
                }
                // make sure there's some work to be done...
                if (Object.keys(urlParts.query).length == 0) {
                    log.debug(__filename, req.path, 'No arguments in query string, aborting update.');
                    return res.status(400).json({ status: 'Invalid request: No arguments in query string.' });
                }
                // make sure we have a team with this ID before updating it
                if (docs.length > 0) {
                    log.debug(__filename, req.path, 'Found Team #' + teamId);
                    let origTeam = JSON.stringify(docs[0]); // for change detection later
                    let team = docs[0];
                    let query = urlParts.query;
                    // team name change?
                    if (query['name'] !== undefined)
                        team.name = query['name'] + '';
                    // team logo change?
                    if (query['logo'] !== undefined)
                        team.logo = query['logo'] + '';
                    // team bot name or weight changes?
                    for (let x = 0; x < 5; x++) {
                        let nameKey = util_1.format('bot%d-name', x + 1);
                        let weightKey = util_1.format('bot%d-weight', x + 1);
                        let coderKey = util_1.format('bot%d-coder', x + 1);
                        let bot = team.bots[x];
                        // update / set bot name if found
                        if (query[nameKey] !== undefined)
                            bot.name = query[nameKey] + '';
                        // update / set bot coder if found
                        if (query[coderKey] !== undefined)
                            bot.coder = query[coderKey] + '';
                        // update / set bot weight if found
                        if (query[weightKey] !== undefined)
                            bot.weight = parseInt(query[weightKey] + '');
                        // update bot if it's there, otherwise add it to the team bots array
                        if (team.bots !== undefined && team.bots.length > x) {
                            bot.id = team.bots[x].id; // need to get the existing id, first
                            team.bots[x] = bot;
                        }
                        else {
                            bot.id = v4_1.default();
                            team.bots.push(bot);
                        }
                    }
                    // don't update the database if there aren't any changes
                    let statusMsg = 'No changes found to apply to Team #';
                    if (origTeam != JSON.stringify(team)) {
                        statusMsg = 'Updates applied to Team #';
                        col.update({ id: teamId }, team);
                    }
                    // return success
                    res.json({ status: util_1.format('%s %s', statusMsg, team.id) });
                }
                else {
                    res.status(404).json({
                        status: util_1.format('No teams with id %s found in collection %s', teamId, COL_NAME)
                    });
                }
            });
        });
        // Handle favicon requests - using the BCBST favicon.ico
        app.get('/favicon.ico', (req, res) => {
            res.setHeader('Content-Type', 'image/x-icon');
            res.status(200).sendFile(path_1.default.resolve('views/favicon.ico'));
        }); // route: /favicon.ico
        // handle images, css, and js file requests
        app.get(['/views/images/:file', '/views/css/:file', '/views/js/:file'], function (req, res) {
            // make sure file exits before sending
            if (fs_1.default.existsSync(path_1.default.resolve('.' + req.path).toString())) {
                res.sendFile(path_1.default.resolve('.' + req.path));
            }
            else {
                res.status(404).send();
            }
        });
        // handle bootstrap css map request
        app.get('/bootstrap.min.css.map', (req, res) => {
            res.sendFile(path_1.default.resolve('views/css/bootstrap.min.css.map'));
        });
        // now handle all remaining routes with express
        app.get('/*', (req, res) => {
            log.debug(__filename, req.path, 'Unhandled route - redirecting to index page.');
            res.render('index', {
                sampleList: util_1.format('http://%s/list', req.headers.host),
                sampleGetAll: util_1.format('http://%s/get', req.headers.host),
                sampleGet: util_1.format('http://%s/get/6e15a6c0-cee8-422e-ba33-df00aa5ddd45', req.headers.host),
                sampleDelete: util_1.format('http://%s/delete/6e15a6c0-cee8-422e-ba33-df00aa5ddd45/pw', req.headers.host),
                sampleAdd: util_1.format('http://%s/add?name=Sample%20Team&logo=unknown_logo_150.png&bot1-name=Bot One&bot1-coder=Mister-E&bot1-weight=20&bot2-name=Bot Two&bot2-coder=Mister-E&bot2-weight=20&bot3-name=Bot Three&bot3-coder=Mister-E&bot3-weight=20&bot4-name=Bot Four&bot4-coder=Mister-E&bot4-weight=20&bot5-name=Bot Five&bot5-coder=Mister-E&bot5-weight=20', req.headers.host),
                sampleUpdate: util_1.format('http://%s/update/6e15a6c0-cee8-422e-ba33-df00aa5ddd45?name=Sample%20Team&bot1-name=Bot One&bot1-coder=Mister-E&bot1-weight=20&bot2-name=Bot Two&bot2-coder=Mister-E&bot2-weight=20&bot3-name=Bot Three&bot3-coder=Mister-E&bot3-weight=20&bot4-name=Bot Four&bot4-coder=Mister-E&bot4-weight=20&bot5-name=Bot Five&bot5-coder=Mister-E&bot5-weight=20', req.headers.host)
            });
        }); // route: /
    }); // app.listen...
}); // MongoClient.connect...
/**
 * Watch for SIGINT (process interrupt signal) and trigger shutdown
 */
process.on('SIGINT', function onSigInt() {
    // all done, close the db connection
    log.info(__filename, 'onSigInt()', 'Got SIGINT - Exiting application...');
    doShutdown();
});
/**
 * Watch for SIGTERM (process terminate signal) and trigger shutdown
 */
process.on('SIGTERM', function onSigTerm() {
    // all done, close the db connection
    log.info(__filename, 'onSigTerm()', 'Got SIGTERM - Exiting application...');
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