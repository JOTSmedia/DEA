import {cpSync, mkdirSync, copyFileSync} from 'node:fs';
mkdirSync('dist', {recursive:true});
for (const file of ['index.html','styles.css','ethereal.css','app.js']) copyFileSync(file, 'dist/' + file);
cpSync('assets', 'dist/assets', {recursive:true});
console.log('Built DEA website in dist/');
