if [ -f node_modules/task/server/server.js ]; then nodemon -w node_modules/task/server node_modules/task/server/server.js -- --config `dv get usedCliches.task.config`; else echo 'No file'; fi;
