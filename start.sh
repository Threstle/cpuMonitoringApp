#!/bin/bash

echo 'Install dependencies front'
npm i
echo 'Done.'
echo 'Build front'
npx webpack
echo 'Done.'

echo 'Copy front to public folder in server'
rm -rf server/public
mkdir server/public
cp -r dist ./server/public/dist
echo 'Done.'

echo 'Install dependencies server'
cd server
npm i
echo 'Done.'
echo 'Launch tests'
npm run test
echo 'Done.'
echo 'Launch server'
node app.js
echo 'Done'
