/*global describe:false, it:false */

'use strict';

var gulpif = require('../');
var gutil = require('gulp-util');

var through = require('through2');
require('should');

describe('gulp-if', function() {

	describe('when given a boolean,', function() {
		var tempFile = './temp.txt';
		var tempFileContent = 'A test generated this file and it is safe to delete';

		it('should call the function when passed truthy', function(done) {
			// Arrange
			var condition = true;
			var called = 0;
			var fakeFile = new gutil.File({
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var s = gulpif(condition, through.obj(function (file, enc, cb) {
				// Test that file got passed through
				(file === fakeFile).should.equal(true);

				called++;
				cb(null, file);
			}));

			// Assert
			s.once('finish', function(){

				// Test that command executed
				called.should.equal(1);
				done();
			});

			// Act
			s.write(fakeFile);
			s.end();
		});

		it('should not call the function when passed falsey', function(done) {
			// Arrange
			var condition = false;
			var called = 0;
			var fakeFile = new gutil.File({
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var s = gulpif(condition, through.obj(function (file, enc, cb) {

				// Test that file got passed through
				(file === fakeFile).should.equal(true);

				called++;
				cb(null, file);
			}));

			// Assert
			s.once('finish', function(){

				// Test that command executed
				called.should.equal(0);
				done();
			});

			// Act
			s.write(fakeFile);
			s.end();
		});

		it('should call the false function when passed truthy', function(done) {
			// Arrange
			var condition = false;
			var called = 0;
			var fakeFile = new gutil.File({
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var s = gulpif(condition, through.obj(function (file, enc, cb) {
				// Test that file got passed through
				(file === fakeFile).should.equal(true);

				called+=10;
				cb(null, file);
			}), through.obj(function (file, enc, cb) {
				// Test that file got passed through
				(file === fakeFile).should.equal(true);

				called++;
				cb(null, file);
			}));

			// Assert
			s.once('finish', function(){

				// Test that command executed
				called.should.equal(1);
				done();
			});

			// Act
			s.write(fakeFile);
			s.end();
		});
	});
});
