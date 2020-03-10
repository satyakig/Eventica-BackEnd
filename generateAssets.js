const cp = require('shelljs').cp;

cp('app.yaml', 'build/');
cp('package.json', 'build/');
