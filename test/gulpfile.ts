import * as gulpIf from "../";
import * as gulp from "gulp";
import * as concat from "gulp-concat";
import * as Vinyl from "vinyl";
import * as gutil from "gulp-util";

// After this task runs, we expect to find all typescript
// files concatenated to a file called files.txt
gulp.task('default', () => {
    return gulpIf(true)
        .then(gulp.src, ['**/*.ts'])
        .otherwise(gulp.src, ['**/*.js'])
        .pipe(concat('files.txt'))
        .pipe(gulp.dest('dist'));
});

// After this task runs, all .js files will be concatenated to a file
// called all.js, while any other file is concatenated to a file
// called rest.txt
gulp.task('test1', () => {
    return gulp.src(['**/*', '!dist/**/*', '!dist/']).pipe(
        gulpIf({
            condition: (vf: Vinyl) => vf.path.endsWith('.js'),
            thenStream: concat('all.js')
        }).otherwise(concat, 'rest.txt'))
        .pipe(gulp.dest('dist'));
});

// After this task runs, we expect to find all .js files
// starting with an 'l' to have been concatenated to a file called
// 'lls.js'. The rest of the .js files will not get concatenated
// Every other non .js file will be concatenated to a file called rest.txt
gulp.task('test2', () => {
    return gulp.src(['**/*', '!dist/**/*', '!dist/']).pipe(
        gulpIf({
            condition: (vf: Vinyl) => vf.path.endsWith('.js'),
            thenStream: gulpIf(/^l.*/i).then(concat, 'lls.js')
        }).otherwise(concat, 'rest.txt'))
        .pipe(gulp.dest('dist'));
});

// After this task runs, we should find a file called index-and-nonjs.txt in the
// dist folder. This file will contain the contents of index.js as well as
// the contents of all non-js files. Another file called all-js.txt will contain
// the contents of the rest of the .js files
gulp.task('test3', () => {
    return gulp.src(['**/*', '!dist/**/*', '!dist/']).pipe(
        gulpIf({
            condition: (vf: Vinyl) => vf.path.endsWith('.js'),
            thenStream: gulpIf('INDEX.JS', {nocase: true}).then(concat, 'found.index.js')
        }).otherwise(concat, 'rest.txt'))
        .pipe(gulpIf('*.+(index.js|txt)').then(concat('index-and-nonjs.txt'))
            .otherwise(concat, 'all-js.txt'))
        .pipe(gulp.dest('dist'));
});

// After this task runs, we expect to find all .js files
// starting with an 'l' to have been concatenated to a file called
// 'lls.js'. The rest of the .js files will not get concatenated
// Every other non .js file will be concatenated to a file called rest.txt
// Finally rest.txt should go to dest/text folder, while lls.js and all other
// .js files which do not start with an l should go to dist/js folder
gulp.task('test4', () => {
    return gulp.src(['**/*', '!dist/**/*', '!dist/']).pipe(
        gulpIf({
            condition: (vf: Vinyl) => vf.path.endsWith('.js'),
            thenStream: gulpIf(/^l.*/i).then(concat, 'lls.js')
        }).otherwise(concat, 'rest.txt'))
        .pipe(gulpIf('*.txt').then(gulp.dest('dist/text')).otherwise(gulp.dest('dist/js')));
});


// After this task runs, we expect two folders within the dist folder namely,
// js and text. Within the dist/js folder, we expect to find bar.js with it's content
// and within the dist/text folder, we expect to find foo.txt
gulp.task('test5', (done) => {
    let myConditionalStream = gulpIf('*.txt').then(gulp.dest('dist/text'))
        .otherwise(gulp.dest('dist/js')).on('finish', done);

    myConditionalStream.write(new gutil.File({
        path: 'foo.txt',
        contents: new Buffer("The quick brown fox jumps over the lazy dog.\n")
    }));

    myConditionalStream.write(new gutil.File({
        path: 'bar.js',
        contents: new Buffer(`
    "use strict";
    var x, y, z;
    x = 5;
    y = 6;
    z = x + y;
    console.log(z);`)
    }));

    myConditionalStream.end();
});

