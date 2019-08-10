# Conventions

## Show components 

- Show components should receive as input both an id and an object to show. They
  should display the object if it is given or fetch the object using `id` if
  otherwise

- Show components should have a `show[Field]` boolean input to determine whether
  a particular field should be shown or not. If within `show-foo`, the component
  shows another entity, say, `bar`, the boolean inputs for `bar`'s fields should
  have the format `showBar[Field]` to differentiate them from `foo`'s fields.

- Components that load some entity from the backend (usually `show-*`) should
  produce the object as output. For example, when `show-foo` loads a `Foo` if
  an `id` is given it should output the object `loadedFoo`.

- Usually, show components perform a check called `this.canEval()` to avoid
  unnecessary reloading of the data it had previously loaded. If this is the
  case, instead of calling `this.gs.get(...)`, the component should call
  `this.gs.noRequest()` so that the run service knows that the component does not
  intend to perform a request. If there is a possibility that an component
  will not perform a request (e.g. because it calls `this.gs.noRequest()` in
  some cases), the component name (e.g. `clichename-show-foo`) should be included
  in the `componentsRequestOptional` array field of the cliché's `dvconfig.json`
  file.

## Create components

- Create components should have a `save` option to determine whether the
  entity being created has to be saved in the database or not. This way, with
  `[save]=false` the component can be used to create local objects.

- Create components should have a `showOptionToSubmit` input to determine
  whether they should show a submit button or not.

- When creating a custom `FormControl`, include an initial value as an `@Input`
  field and an event emitter for its value as an `@Output` field. The latter is
  so that its value can be linked as an input to components with `dvOnExec`.
  Subscribe to the value changes of the input field and emit the new values.
  Do this then set the initial value in `ngOnInit`. For example, in the
  `CreateGoodPrice` component of `Market`:

  ```typescript
  @Input() initialValue = 0;
  @Output() price = new EventEmitter<number>();
  
  ngOnInit() {
    this.priceControl.valueChanges.subscribe((newValue: number) => {
      this.price.emit(newValue);
    });
    // set initial value after subscribing to changes so that it will be emitted
    this.priceControl.setValue(this.initialValue);
  }
  ```

- Users could create their own form with the custom form controls. For example,
  to create a `Good` in `Market`, instead of using the given form layout in the
  `CreateGood` component, a user can create a `Good` with just a price:

  ```html
  <market-create-good-price (price)="goodPrice=$event"></market-create-good-price>
  <market-create-good [price]="goodPrice" [hidden]="true"></market-create-good>
  ```

  Since the `CreateGood` component internally also has its own `CreateGoodPrice`
  form control component, it needs to be able to know whether it will use the
  price value from its own `CreateGoodPrice` or the one from its input. The
  solution is to sync its `@Input price` and the value in its own
  `CreateGoodPrice` form control. This way, the `dvOnRun` of `CreateGood` only
  needs to use the values from its own form. The following code achieves this for
  each input of `CreateGood`:

  ```typescript
  // optional input values to override form control values
  @Input() set price(price: number) {
    this.priceControl.setValue(price);
  }
  @Input() set supply(supply: number) {
    this.supplyControl.setValue(supply);
  }
  @Input() set sellerId(sellerId: string) {
    this.sellerIdControl.setValue(sellerId);
  }
  
  @ViewChild(FormGroupDirective) form;
  
  priceControl = new FormControl();
  supplyControl = new FormControl();
  sellerIdControl = new FormControl();
  createGoodForm: FormGroup = this.builder.group({
    priceControl: this.priceControl,
    supplyControl: this.supplyControl,
    sellerIdControl: this.sellerIdControl
  });
  ```

- When using custom form controls as shown above, since we also need an
  `@Input()` for the same field `foo`, declare the variable for the custom form
  control as `fooControl = new FormControl()`.

- All form controls should reset themselves on exec success

## Reactive components

- The `show-chat` component of the chat cliché is a good example of a reactive
component. It automatically updates whenever a new message for the chat comes in.
It could be used as an example to follow for the steps below. 

- Components can be made reactive (i.e. automatically update its contents) by
  including these things:

  - In the clichés `schema.graphql` file:
    - a declaration of the desired GraphQL subscriptions inside
    `type Subscription {}`, similar to queries and mutations
    - add the following so that the declared subscriptions are recognized:

    ```text
    schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }
    ```

  - In the `server.ts` file:
    - create a `PubSub` object and use it to publish to specific channels every
    time a relevant event (e.g. a creation or an update) happens
    - include the GraphQL subscription resolvers. *For security reasons*, the
    return value of subscriptions should not contain any data. They should
    just return `true`. When an component receives the reply, it should reload
    the data so that if it is in a transaction, all the other components in the
    transaction would also get re-run. This ensures, for example, that any
    authentication or authorization checks happen again.
    - just like other GraphQL requests, add the subscription request(s) to the
    `ComponentRequestTable`. By default, the value of `extraInfo.action` for
    subscriptions is `'subscribe'`.

  - In the `foo.module.ts` file, include the following provider:
  `{ provide: SUBSCRIPTIONS_PATH, useValue: '/subscriptions' }`

  - Call `this.gs.subscribe(...)` in the components themselves. See the note on
  security under the `server.ts` file.

## Misc

- Use an `input` object type in the GraphQL schema if there's more than one
  parameter for the query/mutation and for possibly `null` one-parameter
  methods.

- Components should be aware of the fact that their input objects might have more
  fields than the ones they are expecting. For example, if `create-foo`
  expects a `Foo` it might get an object that is a `Foo` + some other
  merged objects.

- If there's only one id input for an component, only use `id`. Otherwise, use
  named ids, e.g. `fooId` and `barId`.

- If you want to give the user of an component a way to ask to wait for an input
  value create a `waitOn: string[]` input that takes a list of input fields to
  wait on when run. In your Component class you have:

  ```typescript
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
    
  ...
  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field]) {
        this.fieldChange.emit(field);
      }
    }
    ...
  }
  ```

  And in your run method, to wait on changes to the specified inputs, do:
  ```typescript
  await Promise.all(_.chain(this.waitOn)
    .filter((field) => !this[field])
    .map((fieldToWaitFor) => this.fieldChange
      .pipe(filter((field) => field === fieldToWaitFor), take(1))
      .toPromise())
    .value());
  ```


# Other Stuff

- if you don't have a default component for an component input use `no-default-foo`. See [stage-header](https://github.com/spderosso/deja-vu/tree/master/packages/core/src/app/dv/stage) for an example.
