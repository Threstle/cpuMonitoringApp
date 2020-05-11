
// config par défaut
let config = {

    server:{
        port: 8080,

        url: 'http://localhost:8080',

        maxPostSize: '50mb',

        appPath:"/back",
    },

    cpuWatch:{
        // If the cpu load stays above this threshold for heavyload_duration or more it is considered on heavy load
        heavyload_threshold: 1,

        // Time in ms cpu has to stay above threshold to be considered on heavy load
        heavyload_duration: 120000,

        // Time in ms cpu has to stay below threshold to recover from heavy load
        recovery_duration: 120000,

        // Maximum time in ms every data is kept
        timeline_length: 600000
    }


};

module.exports = config;
