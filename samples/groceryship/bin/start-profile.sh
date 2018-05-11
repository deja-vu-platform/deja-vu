if [ -f node_modules/property/server/server.js ]; then node node_modules/property/server/server.js  --config `dv get usedCliches.profile.config` --as profile; else echo 'No file'; fi;
