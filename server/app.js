// ----------------------------------------------------------------------------- DEPENDENCIES

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const MemCache = require('./utils/public-mem-cache');
const CpuWatcher = require('./CpuWatcher.js');


// ----------------------------------------------------------------------------- INIT SERVER

// Load config file
const config = require('./config');

// Launch express server
const app = express();

app.use(bodyParser.json());

// Démarrer l'écoute
app.listen(config.server.port, () => {
    console.log(`started server on port ${config.server.port}`);
    CpuWatcher.watch();
});

MemCache.init(`<h1>Not found</h1>`);


// ----------------------------------------------------------------------------- API


app.use(express.static('public'));


/**
 * Send back infos about the state of the CPU since the last 10mn or since the launch of the server
 */
app.get('/load.json', (req, res) => {

    let alertHistory = CpuWatcher.alertHistory;
    if(CpuWatcher.currentAlert)alertHistory = alertHistory.concat(CpuWatcher.currentAlert);

    res.json({
        snapshots:CpuWatcher.snapshotHistory,
        cpuAlerts:alertHistory,
        cpuAlert:CpuWatcher.cpuAlert,
        timelineBounds:[Date.now()-config.cpuWatch.timeline_length,Date.now()]
    });

    CpuWatcher.cpuAlert = "";
});

app.get('/config.json', (req, res) => {
    res.json(config.cpuWatch);
});

app.get('/', (req, res) => {
    const filePath = path.join('', '../', 'index.html');
    MemCache.resFile(res, filePath);
});



//FIXME
app.get('/node_modules/react/umd/react.development.js', (req, res) => {
    const filePath = path.join('../node_modules/react/umd/react.development.js');
    MemCache.resFile(res, filePath);
});

app.get('/node_modules/react-dom/umd/react-dom.development.js', (req, res) => {
    const filePath = path.join('../node_modules/react-dom/umd/react-dom.development.js');
    MemCache.resFile(res, filePath);
});
