const TBONDS = [
  {
    types: [
      {name: "Source", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Source", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "User", element: "auth", loc: "@@dv-access-auth-1"},
      {name: "User", element: "post", loc: "@@dv-messaging-post-1"},
      {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ],
    subtype: {
      name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    }
  },

  {
    types: [
      {name: "Item", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Post", element: "post", loc: "@@dv-messaging-post-1"},
      {name: "Message", element: "Feed", loc: "@@dv-messaging-feed-1"}
    ],
    subtype: {
      name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    }
  },

  {
    types: [
      {name: "Label", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ],
    subtype: {
      name: "Topic", element: "bookmark", loc: "@@dv-samples-bookmark-1"
    }
  }
];

const FBONDS = [
  {
    fields: [
      {
        name: "published",
        "type": {
          name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      },
      {
        name: "posts",
        "type": {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      }
    ],
    subfield: {
      name: "posts", "type": {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "content",
        "type": {name: "Post", element: "post", loc: "@@dv-messaging-post-1"}
      },
      {
        name: "content",
        "type": {name: "Message", element: "feed", loc: "@@dv-messaging-feed-1"}
      }
    ],
    subfield: {
      name: "content", "type": {
        name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "published",
        "type": {
          name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      },
      {
        name: "items",
        "type": {
          name: "Label", element: "label", loc: "@@dv-organization-label-1"}
      }
    ],
    subfield: {
      name: "posts", "type": {
        name: "Topic", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "follows",
        "type": {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "subscriptions",
        "type": {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ],
    subfield: {
      name: "follows", "type": {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "follows",
        "type": {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "subscriptions",
        "type": {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ],
    subfield: {
      name: "follows", "type": {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "labels",
        "type": {
          name: "Item", element: "label", loc: "@@dv-organization-label-1"
        }
      }
    ],
    subfield: {
      name: "topics", "type": {
        name: "Post", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  },

  {
    fields: [
      {
        name: "name",
        "type": {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        "type": {
          name: "Target", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        "type": {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "name",
        "type": {
          name: "Target", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "username",
        "type": {name: "User", element: "auth", loc: "@@dv-access-auth-1"}
      },
      {
        name: "username",
        "type": {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      },
      {
        name: "name",
        "type": {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      },
      {
        name: "name",
        "type": {
          name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ],
    subfield: {
      name: "username", "type": {
        name: "User", element: "bookmark", loc: "@@dv-samples-bookmark-1"
      }
    }
  }
];

export const COMP_INFO = {
  tbonds: TBONDS,
  fbonds: FBONDS
};
