const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  map: {
    create: Helpers.resolve_create(mean.db, "map"),
    update: Helpers.resolve_update(mean.db, "map")
  },
  marker: {
    create: Helpers.resolve_create(mean.db, "marker"),
    update: Helpers.resolve_update(mean.db, "marker")
  }
};

const bus = new ServerBus(
  mean.fqelement,
  mean.ws,
  handlers,
  mean.comp,
  mean.locs
);

//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Map",
    fields: {
      atom_id: {type: graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Marker",
    fields: {
      atom_id: {type: graphql.GraphQLString},
      lat: {type: graphql.GraphQLFloat},
      lng: {type: graphql.GraphQLFloat},
      map: {type: "Map"},
      title: {type: graphql.GraphQLString},
      update: {
        type: "Marker",
        args: {
          lat: {type: graphql.GraphQLFloat},
          lng: {type: graphql.GraphQLFloat},
          map_id: {type: graphql.GraphQLString},
          title: {type: graphql.GraphQLString}
        },
        resolve: (marker, {lat, lng, map_id, title}) => {
          const setObj = {};
          if (lat || lat === 0) setObj["lat"] = lat;
          if (lng || lng === 0) setObj["lng"] = lng;
          if (map_id) setObj["map.atom_id"] = map_id;
          if (title) setObj["title"] = title;
          const updateObj = {$set: setObj};
          return mean.db.collection("markers")
            .update({atom_id: marker.atom_id}, updateObj)
            .then(_ => bus.update_atom("Marker", marker.atom_id, updateObj));
        }
      }
    }
  })
  .add_mutation({
    name: "createMarker",
    type: "Marker",
    args: {
      lat: {type: graphql.GraphQLFloat},
      lng: {type: graphql.GraphQLFloat},
      title: {type: graphql.GraphQLString},
      map_id: {type: graphql.GraphQLString}
    },
    resolve: (_, {lat, lng, map_id, title}) => {
      const marker = {
        atom_id: uuid.v4(),
        lat: lat,
        lng: lng,
        map: {atom_id: map_id},
        title: title
      };
      return mean.db.collection("markers")
        .insertOne(marker)
        .then(_ => bus.create_atom("Marker", marker.atom_id, marker))
        .then(_ => marker);
    }
  })
  .add_mutation({
    name: "deleteMarker",
    type: "Marker",
    args: {
      marker_id: {type: graphql.GraphQLString}
    },
    resolve: (_, {marker_id}) => {
      return mean.db.collection("markers")
        .deleteOne({"atom_id": marker_id})
        .then(_ => bus.remove_atom("Marker", marker_id))    
    }
  })
  .add_query({
    name: "getMarkersByMap",
    type: "[Marker]",
    args: {
      map_id: {type: graphql.GraphQLString}
    },
    resolve: (_, {map_id}) => {
      return mean.db.collection("markers")
        .find({"map.atom_id": map_id})
        .toArray();
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  mean.start();
});
