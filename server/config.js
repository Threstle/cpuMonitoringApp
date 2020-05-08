
// config par défaut
let config = {

    server:{
        port: 8080,

        url: 'http://localhost:8080',

        // la taille max d'une requête POST
        maxPostSize: '50mb',

        appPath:"/back",
    },

    cpuWatch:{
        bufferTime: 120,

        heavyload_threshold: 1,

        heavyload_duration: 120000,

        recovery_duration: 120000,

        timeline_length: 600000
    }


};

module.exports = config;
