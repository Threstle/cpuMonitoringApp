// ----------------------------------------------------------------------------- DEPENDENCIES

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');
const MemCache = require('./utils/public-mem-cache');

const EServerState ={
    IDLE:"IDLE",
    ABOVETHRESHOLD:"ABOVETHRESHOLD",
    ONHEAVYLOAD:"ONHEAVYLOAD",
    RECOVERING:"RECOVERING",
    RECOVERED:"RECOVERED"
}


// ----------------------------------------------------------------------------- INIT SERVER
let cpuLoadHistory = [];
let incidentHistory = [];
let cpuAlert = "";
let currentIncident = null;
let heavyloadStart = 0;
let recoveryStart = 0;
let serverState = EServerState.IDLE;
let lastLoad = 0;
// Charger la config
const config = require('./config');

// Le serveur express
const app = express();

// Activer CORS pour communiquer entre domaines différents
app.use(cors());

// Parser application/x-www-form-urlencoded
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: config.server.maxPostSize
    })
);
app.use(bodyParser.json());

// Démarrer l'écoute
app.listen(config.server.port, () => {
    console.log(`started server on port ${config.server.port}`);
    watch();
});

// ----------------------------------------------------------------------------- CPU WATCH

function watch ()
{


    const timestamp = Date.now();

    cleanOldData(timestamp);

    let snapshot = {
        load:getCurrentAverageCpuLoad(),
        timestamp:timestamp
    };

    if(snapshot.load != lastLoad)
    {
        detectIncident(snapshot);
        cpuLoadHistory.push(snapshot);
        lastLoad = snapshot.load
    }



    setTimeout(()=>{
        watch();
    },1000);
}

function isOverTime(pCurrentTimestamp,pTimestamp)
{
    return (pCurrentTimestamp - pTimestamp) >= config.cpuWatch.timeline_length;
}

function getCurrentAverageCpuLoad ()
{
    const cpus = os.cpus().length;
    return Number((os.loadavg()[0] / cpus).toPrecision(2));
}

function detectIncident (pSnapshot){


    const snapshotIsAboveThreshold = pSnapshot.load >= config.cpuWatch.heavyload_threshold;

    if(snapshotIsAboveThreshold)
    {
        if(serverState === EServerState.IDLE)
        {
            serverState = EServerState.ABOVETHRESHOLD
            heavyloadStart = pSnapshot.timestamp;
        }

        if(serverState === EServerState.ABOVETHRESHOLD && pSnapshot.timestamp - heavyloadStart >= config.cpuWatch.heavyload_duration){

            serverState = EServerState.ONHEAVYLOAD

            cpuAlert = "heavyload";

            currentIncident = {
                heavyload:{
                    start:heavyloadStart,
                    end:pSnapshot.timestamp
                }
            }
            ;
        }

        if(serverState === EServerState.ONHEAVYLOAD)
        {
            currentIncident.heavyload.end = pSnapshot.timestamp;
        }

        if(serverState === EServerState.RECOVERING)
        {
            serverState = EServerState.ONHEAVYLOAD;
        }

    }
    else
    {
        if(serverState === EServerState.ABOVETHRESHOLD){
            serverState = EServerState.IDLE
        }

        if(serverState === EServerState.ONHEAVYLOAD)
        {
            serverState = EServerState.RECOVERING;
            recoveryStart = pSnapshot.timestamp;
        }

        if(serverState === EServerState.RECOVERING)
        {
            currentIncident.heavyload.end = pSnapshot.timestamp;
        }

        if(serverState === EServerState.RECOVERING && pSnapshot.timestamp - recoveryStart >= config.cpuWatch.recovery_duration)
        {
            serverState = EServerState.IDLE;
            currentIncident.heavyload.end = recoveryStart;
            currentIncident.recovery = {start:recoveryStart,end:pSnapshot.timestamp};

            cpuAlert="recovery";

            incidentHistory.push({
                heavyload:currentIncident.heavyload,
                recovery:currentIncident.recovery
            });

            currentIncident = null;
        }
    }
}

function cleanOldData (pTimestamp){

    incidentHistory = incidentHistory.filter((incident)=>{
        return !isOverTime(pTimestamp,incident.recovery.end)
    })

    if(cpuLoadHistory.length > 0)
    {
        if(isOverTime(pTimestamp,cpuLoadHistory[0].timestamp)){
            cpuLoadHistory.shift()
        }
    }

}

// ----------------------------------------------------------------------------- API
MemCache.init(`<h1>Not found</h1>`);

app.use(express.static('public'));


/**
 * ENDPOINT
 */
app.get('/load.json', (req, res) => {

    let incidents = incidentHistory;
    if(currentIncident)incidents = incidents.concat(currentIncident);

    res.json({
        snapshots:cpuLoadHistory,
        incidents:incidents,
        cpuAlert:cpuAlert,
        timelineBounds:[Date.now()-config.cpuWatch.timeline_length,Date.now()]
    });

    cpuAlert = "";
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
