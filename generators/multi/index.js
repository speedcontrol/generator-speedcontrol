'use strict';

var yeoman = require('yeoman-generator');
var extend = require('deep-extend');
var Mustache = require('Mustache');

module.exports = yeoman.Base.extend({
	initializing: function () {
		this.props = {};
	},

	prompting: {
		askFor: function () {
			var done = this.async();

			var prompts = [{
				type: 'input',
				name: 'sceneID',
				message: 'Your graphic\'s scene ID',
			}, {
				type: 'input',
				name: 'width',
				message: 'Your graphic\'s width (in pixels)',
				default: 1280,
				filter: function (input) {
					return parseInt(input, 10);
				},
				validate: function (input) {
					return input > 0;
				}
			}, {
				type: 'input',
				name: 'height',
				message: 'Your graphic\'s height (in pixels)',
				default: 720,
				filter: function (input) {
					return parseInt(input, 10);
				},
				validate: function (input) {
					return input > 0;
				}
			}];

			this.prompt(prompts).then(function (props) {
				this.props = extend(this.props, props);
				done();
			}.bind(this));
		}
	},

	writing: function () {
		var html = this.fs.read(this.templatePath('multi.html'));

    var htmlFile = "graphics/"+this.props.sceneID+".html";
    var cssFile = "graphics/"+this.props.sceneID+".css";
    var graphicProps = {
      file: this.props.sceneID+".html",
			width: this.props.width,
			height: this.props.height
    }


    if (!this.fs.exists(graphicProps.file)) {
      this.fs.write(htmlFile, Mustache.render(html,this.props));
    }

    var cssTemplate = this.fs.read(this.templatePath('multi.css'));
    var cssOutput = Mustache.render(cssTemplate, this.props);
    if( !this.fs.exists(cssFile)) {
      this.fs.write(cssFile, cssOutput);
    }

		// Re-read the content at this point because a composed generator might modify it.
		var currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});
		currentPkg.nodecg = currentPkg.nodecg || {};
		currentPkg.nodecg.graphics = currentPkg.nodecg.graphics || [];
		currentPkg.nodecg.graphics.push(graphicProps);


		// Let's extend package.json so we're not overwriting user previous fields
		this.fs.writeJSON(this.destinationPath('package.json'), currentPkg);
	}
});
