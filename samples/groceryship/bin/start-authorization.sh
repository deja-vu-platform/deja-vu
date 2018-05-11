if [ -f node_modules/authorization/server/server.js ]; then node node_modules/authorization/server/server.js  --config `dv get usedCliches.authorization.config`; else echo 'No file'; fi;
