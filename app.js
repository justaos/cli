const express = require('express');
const engine = require('ejs-locals');
const app = express();

// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
// set the view engine to ejs
app.set('view engine', 'ejs');

app.set('views', __dirname + '/views');

// render 'index' into 'boilerplate':
app.get('/', function (req, res, next) {
    res.render('index');
});
app.get('/pages/form', function (req, res, next) {
    res.render('pages/form', {_layoutFile: __dirname + '/views/layouts/layout'});
});

app.listen(80, function () {
    console.log('Example app listening on port 80!')
});