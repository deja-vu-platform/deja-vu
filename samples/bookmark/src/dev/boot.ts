import {provide, Component, PLATFORM_DIRECTIVES} from "angular2/core";
import {bootstrap} from "angular2/platform/browser";
import {ROUTER_PROVIDERS} from "angular2/router";

import {BookmarkComponent} from "../components/bookmark/bookmark";

import "rxjs/add/operator/map";



const LOCS = {
  bookmark_1: "@@dv-samples-bookmark-1",
  auth_1: "@@dv-access-auth-1",
  follow_1: "@@dv-community-follow-1",
  follow_2: "@@dv-community-follow-2",
  post_1: "@@dv-messaging-post-1",
  label_1: "@@dv-organization-label-1",
  feed_1: "@@dv-messaging-feed-1"
};

@Component({
  selector: "publisher-message",
  template: `{{msg.content}}`,
  inputs: ["msg"]
})
class PublisherMessageComponent {}

@Component({
  selector: "publisher",
  template: `{{pub.name}}`,
  inputs: ["pub"]
})
class PublisherComponent {}


const TBONDS = [
  {
    types: [
      {name: "Source", element: "follow", loc: LOCS.follow_1},
      {name: "Target", element: "follow", loc: LOCS.follow_1},
      {name: "Source", element: "follow", loc: LOCS.follow_2},
      {name: "User", element: "auth", loc: LOCS.auth_1},
      {name: "User", element: "post", loc: LOCS.post_1},
      {name: "Subscriber", element: "feed", loc: LOCS.feed_1},
      {name: "Publisher", element: "feed", loc: LOCS.feed_1}
    ],
    subtype: {
      name: "User", element: "bookmark", loc: LOCS.bookmark_1
    }
  },

  {
    types: [
      {name: "Item", element: "label", loc: LOCS.label_1},
      {name: "Post", element: "post", loc: LOCS.post_1},
      {name: "Message", element: "Feed", loc: LOCS.feed_1}
    ],
    subtype: {
      name: "Post", element: "bookmark", loc: LOCS.bookmark_1
    }
  },

  {
    types: [
      {name: "Label", element: "label", loc: LOCS.label_1},
      {name: "Target", element: "follow", loc: LOCS.follow_2},
      {name: "Publisher", element: "feed", loc: LOCS.feed_1}
    ],
    subtype: {
      name: "Topic", element: "bookmark", loc: LOCS.bookmark_1
    }
  }
];

export const FBONDS = [
  {
    fields: [
      {
        name: "published",
        "type": {
          name: "Publisher", element: "feed", loc: LOCS.feed_1
        }
      },
      {
        name: "posts",
        "type": {name: "User", element: "post", loc: LOCS.post_1}
      }
    ],
    subfield: {
      name: "posts", "type": {
        name: "User", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "content",
        "type": {name: "Post", element: "post", loc: LOCS.post_1}
      },
      {
        name: "content",
        "type": {name: "Message", element: "feed", loc: LOCS.feed_1}
      }
    ],
    subfield: {
      name: "content", "type": {
        name: "Post", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "published",
        "type": {
          name: "Publisher", element: "feed", loc: LOCS.feed_1
        }
      }
    ],
    subfield: {
      name: "posts", "type": {
        name: "Topic", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "follows",
        "type": {
          name: "Source", element: "follow", loc: LOCS.follow_1
        }
      },
      {
        name: "subscriptions",
        "type": {
          name: "Subscriber", element: "feed", loc: LOCS.feed_1
        }
      }
    ],
    subfield: {
      name: "follows", "type": {
        name: "User", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "follows",
        "type": {
          name: "Source", element: "follow", loc: LOCS.follow_2
        }
      },
      {
        name: "subscriptions",
        "type": {
          name: "Subscriber", element: "feed", loc: LOCS.feed_1
        }
      }
    ],
    subfield: {
      name: "follows", "type": {
        name: "User", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "labels",
        "type": {
          name: "Item", element: "label", loc: LOCS.label_1
        }
      }
    ],
    subfield: {
      name: "topics", "type": {
        name: "Post", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  },

  {
    fields: [
      {
        name: "name",
        "type": {
          name: "Source", element: "follow", loc: LOCS.follow_1
        }
      },
      {
        name: "name",
        "type": {
          name: "Target", element: "follow", loc: LOCS.follow_1
        }
      },
      {
        name: "name",
        "type": {
          name: "Source", element: "follow", loc: LOCS.follow_2
        }
      },
      {
        name: "name",
        "type": {
          name: "Target", element: "follow", loc: LOCS.follow_2
        }
      },
      {
        name: "username",
        "type": {name: "User", element: "auth", loc: LOCS.auth_1}
      },
      {
        name: "username",
        "type": {name: "User", element: "post", loc: LOCS.post_1}
      },
      {
        name: "name",
        "type": {
          name: "Subscriber", element: "feed", loc: LOCS.feed_1
        }
      },
      {
        name: "name",
        "type": {
          name: "Publisher", element: "feed", loc: LOCS.feed_1
        }
      }
    ],
    subfield: {
      name: "username", "type": {
        name: "User", element: "bookmark", loc: LOCS.bookmark_1
      }
    }
  }
];

const COMP_INFO = {
  tbonds: TBONDS,
  fbonds: FBONDS
};


bootstrap(
  BookmarkComponent, [
    provide("auth.api", {useValue: LOCS.auth_1}),
    provide("follow_1.api", {useValue: LOCS.follow_1}),
    provide("follow_2.api", {useValue: LOCS.follow_2}),
    provide("post.api", {useValue: LOCS.post_1}),
    provide("feed.api", {useValue: LOCS.feed_1}),
    provide("label.api", {useValue: LOCS.label_1}),
    ROUTER_PROVIDERS,
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherMessageComponent, multi: true}),
    provide(
      PLATFORM_DIRECTIVES, {useValue: PublisherComponent, multi: true}),
    provide("element", {useValue: "bookmark"}),
    provide("loc", {useValue: LOCS.bookmark_1}),
    provide("CompInfo", {useValue: COMP_INFO})
  ]);
