
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

        heavyload_threshold: 0.6,

        heavyload_duration: 1200,

        recovery_duration: 1200,

        timeline_length: 600000
    }


};

module.exports = config;
