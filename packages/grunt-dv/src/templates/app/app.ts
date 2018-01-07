import {Mean} from "mean-loader";
import {ServerBus} from "server-bus";

const mean = new Mean();
const bus = new ServerBus(mean.fqelement,  mean.ws, {}, mean.comp, mean.locs);

mean.start();

console.log("Initializing DB");

@@server_data;
