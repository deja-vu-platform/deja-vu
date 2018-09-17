if [ -f node_modules/authentication/server/server.js ]; then node node_modules/authentication/server/server.js  --config `dv get usedCliches.authentication.config`; else echo 'No file'; fi;
