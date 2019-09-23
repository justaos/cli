const {src, dest, watch} = require('gulp');
let sass = require('gulp-sass');
let sourcemaps = require('gulp-sourcemaps');

let SRC = './assets/styles/scss/**/*.scss';
let DEST = './assets/styles/';

function scssTask(){
  return src(SRC)
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(sourcemaps.write('.'))
      .pipe(dest(DEST)
      );
}

//build
function build() {
  scssTask();
}

function reload() {
  return watch(SRC, function() {
    build();
  });
}

exports.default = function() {
  build();
  reload();
};