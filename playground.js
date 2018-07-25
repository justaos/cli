const program = require('commander');
/*
const DatabaseConnector = require("./src/config/database-connector");
const mongoose = require('mongoose');

const db = new DatabaseConnector();
db.connect().then(() => {
    DatabaseConnector.setInstance(db);
    const Schema = new mongoose.Schema({
        fullname: {type: String, required: true},
        username: { type: String, required: true },
        friends: [
            { type: mongoose.Schema.ObjectId, ref: 'User' }
        ]
    });

    db.getConnection().model('User', Schema);

    db.getConnection().models['User'].
    find({ }).
    populate().exec(function(err, users){
        console.log(users[1].friends[0])
    })
});*/


program
    .version('1.3.0', '-v, --version')
    .command('setup')
    .description('Setup the platform')
    .action(function (args) {
        console.log('test');
    });


program.parse(process.argv);