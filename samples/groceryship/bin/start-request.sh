if [ -f node_modules/property/server/server.js ]; then node node_modules/property/server/server.js  --config `dv get usedCliches.request.config` --as request; else echo 'No file'; fi;
