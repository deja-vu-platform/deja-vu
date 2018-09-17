if [ -f node_modules/rating/server/server.js ]; then node node_modules/rating/server/server.js  --config `dv get usedCliches.rating.config`; else echo 'No file'; fi;
