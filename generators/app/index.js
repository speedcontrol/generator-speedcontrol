'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var parseAuthor = require('parse-author');
var githubUsername = require('github-username');
var _ = require('lodash');
var askName = require('inquirer-npm-name');
var extend = require('deep-extend');
var mkdirp = require('mkdirp');
var path = require('path');

module.exports = yeoman.Base.extend({

  initializing: function() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('Speedcontrol graphics bundle') + ' generator!'
    ));

        this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

        this.props = {
            name: this.pkg.name,
            description: this.pkg.description,
            version: this.pkg.version,
            homepage: this.pkg.homepage
        };

  	    if (_.isObject(this.pkg.author)) {
      		this.props.authorName = this.pkg.author.name;
  	    	this.props.authorEmail = this.pkg.author.email;
  		    this.props.authorUrl = this.pkg.author.url;
      	}
        else if (_.isString(this.pkg.author)) {
  		    var info = parseAuthor(this.pkg.author);
              this.props.authorName = info.name;
              this.props.authorEmail = info.email;
              this.props.authorUrl = info.url;
        }
  },


  prompting: {
    askForModuleName: function () {
			return askName({
				name: 'name',
				message: 'Your bundle Name',
				default: _.kebabCase(path.basename(process.cwd())),
				filter: _.kebabCase,
				validate: function (str) {
					return str.length > 0;
				}
			}, this).then(function (name) {
				this.props.name = name.name;
			}.bind(this));
		},

		askFor: function () {
			var done = this.async();

			var prompts = [{
				name: 'description',
				message: 'Description',
				when: !this.props.description
			}, {
				name: 'homepage',
				message: 'Project homepage url',
				when: !this.props.homepage
			}, {
				name: 'authorName',
				message: 'Author\'s Name',
				when: !this.props.authorName,
				default: this.user.git.name(),
				store: true
			}, {
				name: 'authorEmail',
				message: 'Author\'s Email',
				when: !this.props.authorEmail,
				default: this.user.git.email(),
				store: true
			}, {
				name: 'authorUrl',
				message: 'Author\'s Homepage',
				when: !this.props.authorUrl,
				store: true
			}, {
        name: 'githubAccount',
        message: 'GitHub username or organization',
      }, {
				name: 'keywords',
				message: 'Package keywords (comma to split)',
				when: !this.pkg.keywords,
				filter: function (words) {
					return words.split(/\s*,\s*/g);
				}
			}, {
				name: 'compatibleRange',
				message: 'What semver range of NodeCG versions is this bundle compatible with?',
				type: 'input',
				default: '~0.7.0'
			}, {
        name: 'scCompatRange',
        message: 'What semver range of Speedcontrol versions is this bundle compatible with?',
        type: 'input',
        default: '~0.8'
      }, {
				name: 'intermission',
				message: 'Would you like to make an intermission graphic for your bundle?',
				type: 'confirm',
        default: false
			}, {
				name: 'multi',
				message: 'Would you like to make a multi-scene graphic for your bundle?',
				type: 'confirm',
        default: false
			}, {
				name: 'single',
				message: 'Would you like to make a single-scene graphic for your bundle?',
				type: 'confirm'
			}];

			this.prompt(prompts).then(function (props) {
				this.props = extend(this.props, props);
				done();
			}.bind(this));
		},
  },

  writing: function () {
    // Re-read the content at this point because a composed generator might modify it.
    var currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    var pkg = extend({
      name: _.kebabCase(this.props.name),
      version: '0.0.0',
      description: this.props.description,
      homepage: this.props.homepage,
      author: {
        name: this.props.authorName,
        email: this.props.authorEmail,
        url: this.props.authorUrl
      },
      files: [
        'dashboard',
        'graphics',
        'extension.js',
        'extension'
      ],
      keywords: [
        'nodecg-bundle'
      ],
      nodecg: {
        compatibleRange: this.props.compatibleRange,
        dependencies: [ "speedcontrol/nodecg-speedcontrol:"+this.props.scCompatRange]
      }
    }, currentPkg);

    // Combine the keywords
    if (this.props.keywords) {
      pkg.keywords = _.uniq(this.props.keywords.concat(pkg.keywords));
    }

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);


    // Replace the .gitignore from node:git with our own.
    this.fs.write(this.destinationPath('.gitignore'), 'node_modules\ncoverage\nbower_components');

  },

  default: function() {
      if (path.basename(this.destinationPath()) !== this.props.name) {
      console.log(this.props.name);
      this.log(
        'Your bundle must be inside a folder named ' + this.props.name + '\n' +
        'I\'ll automatically create this folder.'
      );
      mkdirp(this.props.name);
      this.destinationRoot(this.destinationPath(this.props.name));
    }

    // this.composeWith('node:git', {
    //   options: {
    //     name: this.props.name,
    //     githubAccount: this.props.githubAccount
    //   }
    // }, {
    //   local: require.resolve('generator-node/generators/git')
    // });

    if (!this.pkg.license) {
      this.composeWith('license', {
        options: {
          name: this.props.authorName,
          email: this.props.authorEmail,
          website: this.props.authorUrl
        }
      }, {
        local: require.resolve('generator-license/app')
      });
    }

    if (this.props.multi) {
      this.composeWith('speedcontrol:multi', {}, {
        local: require.resolve('./../multi')
      });
    }

    if (this.props.single) {
      this.composeWith('speedcontrol:single', {}, {
        local: require.resolve('./../single')
      });
    }

    if (this.props.extension) {
      this.composeWith('speedcontrol:intermission', {}, {
        local: require.resolve('./../intermission')
      });
    }
  },

  install: function () {
    this.installDependencies();
  }
});
