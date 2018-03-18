let gulp = require('gulp');
let watch = require('gulp-watch');
let sass = require('gulp-sass');
let path = require('path');
let runSequence = require('run-sequence');
let sourcemaps = require('gulp-sourcemaps');
let SRC = './styles/scss/**/*.scss';
let DEST = './styles/';


gulp.task('sass', function () {
    return gulp.src(path.join(SRC))
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle : 'compressed'
        }).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DEST));
});

//build and export
gulp.task('default', function () {
    console.log('Building and watching');
    runSequence('build', 'reload');
});

//build
gulp.task('build', function() {
    console.log('Building');
    runSequence('sass');
});

gulp.task('reload', function () {
    return watch(SRC, function () {
        gulp.start('build');
    })
});