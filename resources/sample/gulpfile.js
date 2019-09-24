const {src, dest, watch, series} = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

const SRC = './assets/styles/scss/**/*.scss';
const DEST = './assets/styles/';

function scssTask() {
    return src(SRC)
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(DEST));
}

exports.default = function () {
    watch(SRC, scssTask);
};