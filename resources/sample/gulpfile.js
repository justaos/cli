const {src, dest, watch, series} = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const glob = require('glob');

const SRC = './assets/styles/scss/**/*.scss';
const DEST = './assets/styles/';

function scssTask(srcPath, destPath) {
    return function () {
        return src(srcPath)
            .pipe(sourcemaps.init())
            .pipe(sass())
            .pipe(sourcemaps.write('.'))
            .pipe(dest(destPath));
    }
}


exports.default = function () {
    watch(SRC, scssTask(SRC, DEST));
    glob.sync(__dirname + '/apps/**/styles').forEach(file => {
        let src = file + '/scss/**/*.scss';
        watch(src, scssTask(src, file + '/'));
    });
};