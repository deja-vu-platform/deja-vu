const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  score: {
      create: Helpers.resolve_create(mean.db, "score"),
      update: Helpers.resolve_update(mean.db, "score")
  },
  target: {
      create: Helpers.resolve_create(mean.db, "target"),
      update: Helpers.resolve_update(mean.db, "target")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Score",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString},
      score: {"type": graphql.GraphQLFloat}
    }
  })
  .add_type({
    name: "Target",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      name: {"type": graphql.GraphQLString},
      scores: {"type": "[Score]"},
      updateScore: {
        "type": graphql.GraphQLBoolean,
        args: {
          name: {"type": graphql.GraphQLString},
          score: {"type": graphql.GraphQLFloat}
        },
        resolve: (target, {name, score}) => {
          const scoreObj = {
            atom_id: uuid.v4(),
            name: name,
            score: score
          };
          const newScoreOp = {$push: {scores: scoreObj}};

          return mean.db.collection("scores")
            .insertOne(scoreObj)
            .then(_ => mean.db.collection("targets")
              .updateOne({atom_id: target.atom_id}, newScoreOp)
              .then(_ => Promise.all([
                bus.create_atom("Score", scoreObj.atom_id, scoreObj),
                bus.update_atom("Target", target.atom_id, newScoreOp)])))
            .then(_ => true);
        }
      },
      getTotal: {
        "type": graphql.GraphQLFloat,
        args: {
          // temp: using instead of config files to specify the aggregate function
          aggregateType: {"type": graphql.GraphQLString}
        },
        resolve: (target, {aggregateType}) => {
            // account for case when scores field hasn't been set yet
            return target.scores ? 
              aggregateFunctions[aggregateType](target.scores) : 0;
        }
      }
    }
  })
  .schema();

const aggregateFunctions = {
  lingua: function(scores) {
    return scores.reduce(function(total, score) {
      return total + score.score;
    }, 0)
  }
}

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  mean.start();
});
