Conventions
===========

- In the case of something like `ShowTask` that needs to display a task it would end up having an object
  (task) and id (id) input and would fetch the object if only the id is given or use the object instead.
  
- When object types (e.g. `Rating`) in the schema have references to other defined object types (e.g. `Source`), use the object type instead of the id even if the only field in the object type is `id`. Example:

Yes:
 ```
 type Source {
   id: ID!
 }
 
 type Target {
   id: ID!
 }
 
 type Rating {
  source: Source!
  target: Target!
  rating: Float!
}
 ```
 No:
 ```
 type Source {
   id: ID!
 }
 
 type Target {
   id: ID!
 }
 
 type Rating {
  sourceId: ID!
  targetId: ID!
  rating: Float!
}
 ```

- When creating a custom `FormControl`, include an initial value as an `@Input` field and an event emitter for its value as an `@Output` field. The latter is so that its value can be linked as an input to components with `dvOnRun`. Subscribe to the value changes of the input field and emit the new values. Do this then set the initial value in `ngOnInit`. For example, in the `CreateGoodPrice` component of `Market`:
```javascript
@Input() initialValue: number = 0;
@Output() price: EventEmitter<number> = new EventEmitter<number>();

ngOnInit() {
  this.priceControl.valueChanges.subscribe((newValue: number) => {
    this.price.emit(newValue);
  });
  // set initial value after subscribing to changes so that it will be emitted
  this.priceControl.setValue(this.initialValue);
}
```

- Users could create their own form with the custom form controls. For example, to create a `Good` in `Market`, instead of using the given form layout in the `CreateGood` component, a user can create a `Good` with just a price:
```html
<market-create-good-price (price)="goodPrice = $event"></market-create-good-price>
<market-create-good [price]="goodPrice" [hidden]="true"></market-create-good>
```
Since the `CreateGood` component internally also has its own `CreateGoodPrice` form control component, it needs to be able to know whether it will use the price value from its own `CreateGoodPrice` or the one from its input. The solution is to sync its `@Input price` and the value in its own `CreateGoodPrice` form control. This way, the `dvOnRun` of `CreateGood` only needs to use the values from its own form. The following code achieves this for each input of `CreateGood`:
```javascript
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
