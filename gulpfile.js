/*----Require----*/
var babel = require('gulp-babel');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');

/*----Javascript Files----*/
var jsInputFiles  = ['./src/exports.js'];
var jsOutputFile = './lib/bundle.js';
var jsOutputDir = './lib/';

/*----Gulp Task----*/
gulp.task('default', ['scripts']);

gulp.task('clean', function () {
    return del(jsOutputFile);
});

gulp.task('scripts', ['clean'], function(){
    return browserify({
            entries: jsInputFiles,
            debug: true
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest(jsOutputDir));
});
