const program = require('commander');
const config = require('./src/config/config');

const DatabaseConnector = require("anysols-model").DatabaseConnector;
const mongoose = require('mongoose');

const db = new DatabaseConnector(config.db);
db.connect().then(() => {
    const Schema = new mongoose.Schema({
        fullname: {type: String, required: true},
        username: {type: String, required: true},
        friends: [
            {type: mongoose.Schema.ObjectId, ref: 'User'}
        ]
    });

    db.getConnection().model('User', Schema);

    let User = db.getConnection().model('User');
    console.log(new User().isNew);
});
/*


program
    .version('1.3.0', '-v, --version')
    .command('setup')
    .description('Setup the platform')
    .action(function (args) {
        console.log('test');
    });


program.parse(process.argv);*/