import * as gulpIf from "../";
import * as gulp from "gulp";
import * as concat from "gulp-concat";
import * as Vinyl from "vinyl";

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
// the contents of all non-js files
gulp.task('test3', () => {
    return gulp.src(['**/*', '!dist/**/*', '!dist/']).pipe(
        gulpIf({
            condition: (vf: Vinyl) => vf.path.endsWith('.js'),
            thenStream: gulpIf('INDEX.JS', {nocase: true}).then(concat, 'found.index.js')
        }).otherwise(concat, 'rest.txt'))
        .pipe(gulpIf('*.+(index.js|txt)').then(concat('index-and-nonjs.txt'))
            .otherwise(concat, 'something.txt'))
        .pipe(gulp.dest('dist'));
});
