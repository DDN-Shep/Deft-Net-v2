var path = require('path');

var config = {
    development: {
        engine: 'jade',
        log: 'dev',
        port: process.env.PORT || 3000,
        path: {
            public: path.join(__dirname, 'public'),
            icon: path.join(__dirname, 'public/images/favicon.ico'),
            views: path.join(__dirname, 'server/views')
        },
        db: {
            name: 'ddn',
            connection: 'mongodb://localhost/ddn'
        }
    },
    test: {
        engine: 'jade',
        log: 'test',
        port: process.env.PORT || 3000,
        path: {
            public: path.join(__dirname, 'public'),
            icon: path.join(__dirname, 'public/images/favicon.ico'),
            views: path.join(__dirname, 'server/views')
        },
        db: {
            name: 'ddn',
            connection: 'mongodb://localhost/ddn'
        }
    },
    production: {
        engine: 'jade',
        log: 'production',
        port: process.env.PORT || 80,
        path: {
            public: path.join(__dirname, 'public'),
            icon: path.join(__dirname, 'public/images/favicon.ico'),
            views: path.join(__dirname, 'server/views')
        },
        db: {
            name: 'ddn',
            connection: 'mongodb://localhost/ddn'
        }
    }
};

module.exports = config;