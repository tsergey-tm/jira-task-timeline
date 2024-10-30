set -e

npm install
npm run build

cd ./pub-dist
git fetch --prune
git checkout main
git reset --hard origin/main
cd ..
rm -rf ./pub-dist/*
cp -r ./dist/* ./pub-dist/
cp -r ./pub-dist-src/* ./pub-dist/
cd ./pub-dist
cat ./manifest.json | jq '.version = "'$(date +%Y%m%d.%H%M%S)'"' > ./manifest.new
rm -f ./manifest.json
mv ./manifest.new ./manifest.json
git add ./
git commit -m "New version"
git push
cd ..
