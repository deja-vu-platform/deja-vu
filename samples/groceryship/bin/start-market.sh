if [ -f node_modules/market/server/server.js ]; then node node_modules/market/server/server.js  --config `dv get usedCliches.market.config`; else echo 'No file'; fi;
