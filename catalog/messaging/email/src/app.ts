import {Promise} from "es6-promise";
const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";
import * as MailgunJS from "mailgun-js";

import * as _u from "underscore";

const mean = new Mean();


const bus = new ServerBus(
    mean.fqelement, mean.ws, {}, mean.comp, mean.locs);

// TODO: Move to external config after we implement that :)
const MAILGUN_API_KEY = 'key-85b65e04485869c029a2967b6ba396f3';
const MAILGUN_DOMAIN = 'sandbox65d5a29b3ce54f70a27e876a2fe13fad.mailgun.org';
const mailgun = MailgunJS({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN
});

//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

console.log("calling schema");
const schema = grafo
  .add_mutation({
    name: "sendEmail",
    "type": graphql.GraphQLBoolean,
    args: {
      to: {"type": graphql.GraphQLString},
      content: {"type": graphql.GraphQLString}
    },
    resolve: (_, {to, content}) => {
      let emailData = {
        from: 'Deja Vu <noreply@' + MAILGUN_DOMAIN + '>',
        to: to,
        subject: 'Message from Deja Vu',
        text: content
      };

      return mailgun.messages().send(emailData);
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
