/// <reference path="../typings/tsd.d.ts" />
// import {Promise} from "es6-promise";
const graphql = require("graphql");
// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");


const topic_type = new graphql.GraphQLObjectType({
  name: "Topic",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    posts: {"type": new graphql.GraphQLList(topic_type)}
  })
});

const post_type = new graphql.GraphQLObjectType({
  name: "Post",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    topics: {
      "type": new graphql.GraphQLList(topic_type)
    }
  })
});

const user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    follows: {
      "type": new graphql.GraphQLList(new graphql.GraphQLUnionType({
        name: "Follow",
        types: [user_type, topic_type],
        resolveType: value => ("username" in value) ? user_type : topic_type
      }))
    },
    posts: {
      "type": new graphql.GraphQLList(post_type)
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      user: {
        "type": user_type,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {username}) => {
          console.log(`getting ${username}`);
        }
      },
      posts: {
        "type": new graphql.GraphQLList(post_type),
        resolve: (root) => {
          console.log("getting posts");
        }
      }
    }
  })
});


const mean = new mean_mod.Mean("bookmark");
mean.serve_schema(schema);

mean.app.use("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

setTimeout(init_composer, 10 * 1000);  // hack..
setTimeout(init_db, 30 * 1000);  // hack..


/*
 * - Users create posts and attach topics to them
 * - Users can follow other users or topics
 * - Users get a feed with all the posts of the users or topics they follow
 */
function init_composer() {
  console.log("Creating type bonds");
  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Source", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Source", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "User", element: "auth", loc: "@@dv-access-auth-1"},
      {name: "User", element: "post", loc: "@@dv-messaging-post-1"},
      {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ], subtype: {
      name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    })
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Item", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Post", element: "post", loc: "@@dv-messaging-post-1"},
      {name: "Message", element: "Feed", loc: "@@dv-messaging-feed-1"}
    ], subtype: {
      name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    })
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Label", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ], subtype: {
      name: "Topic", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    })
  }`);


  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "published",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
      },
      {
        name: "posts",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      }
    ], subfield: {
      name: "posts", type: {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "content",
        type: {name: "Post", element: "post", loc: "@@dv-messaging-post-1"}
      },
      {
        name: "content",
        type: {name: "Message", element: "feed", loc: "@@dv-messaging-feed-1"}
      }
    ], subfield: {
      name: "content", type: {
        name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "published",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
      }
    ], subfield: {
      name: "posts", type: {
        name: "Topic", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "follows",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "subscriptions",
        type: {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ], subfield: {
      name: "follows", type: {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "follows",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "subscriptions",
        type: {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ], subfield: {
      name: "follows", type: {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "labels",
        type: {
          name: "Item", element: "label", loc: "@@dv-organization-label-1"
        }
      }
    ], subfield: {
      name: "topics", type: {
        name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "name",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        type: {
          name: "Target", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "name",
        type: {
          name: "Target", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "username",
        type: {name: "User", element: "auth", loc: "@@dv-access-auth-1"}
      },
      {
        name: "username",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      },
      {
        name: "name",
        type: {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      },
      {
        name: "name",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
      }
    ], subfield: {
      name: "username", type: {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    })
  }`);
}


function init_db() {
  mean.composer.new_atom(
      topic_type, "3", {
        name: "hello",
        posts: [{atom_id: "1"}, {atom_id: "2"}]
      });
  mean.composer.new_atom(
      post_type, "1", {
        name: "1",
        content: "hello, I'm Ben",
        topics: [{atom_id: "3"}]
      });
  mean.composer.new_atom(
      post_type, "2", {
        name: "2",
        content: "hello, I'm Alyssa",
        topics: [{atom_id: "3"}]
      });
  mean.composer.new_atom(
      user_type, "1", {
        username: "benbitdiddle", follows: [],
        posts: [{atom_id: "1"}]
      });
  mean.composer.new_atom(
      user_type, "2", {
        username: "alyssaphacker", follows: [],
        posts: [{atom_id: "2"}]
      });
}
