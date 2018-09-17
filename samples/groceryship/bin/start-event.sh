if [ -f node_modules/event/server/server.js ]; then node node_modules/event/server/server.js  --config `dv get usedCliches.event.config`; else echo 'No file'; fi;
