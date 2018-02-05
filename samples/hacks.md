# List of Hacks (ongoing)
Read before building sample applications.

## Table of Contents
1. [Hyperlinks that require context](#hyperlink)
2. [Widget Fields with Default Values](#widget)
3. [Images](#images)
4. [dvAfterInit()](#after)
5. [Other Warnings](#warnings)

## Hyperlinks that require context <a name="hyperlink"></a>
Scenario: Given a competition `<name>`, you want to add climbers to it. To do this, you need to click a link/ button to redirect the user to a page containing all of the climbers in the competition `<name>`.

**Solution**
1. In the dv file, create a widget with a `on_redirect` field pointing to the desired widget and fields that correspond to the context that you want to be passed to the desired widget.

2. Create a component for the new widget. This is an html file that contains at least the following:
```
<div>
    <a [dvLink]="on_redirect">Link Name</a>
</div>
```

3. Use this new widget as you would with any other. 

For a more concrete example, please look at the dv file, widget component and usage in the example below.

[DV File](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/livescorecard.dv)
|
[Widget](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/src/components/link-to-hosts/link-to-hosts.html)
|
[Usage](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/src/components/show-and-edit-competition/show-and-edit-competition.html#L18)

## Widget Fields with Default Values <a name="widget"></a>
Problem: If you want to define a field with a default value that is only used in the HTML of the widget, it does not appear.

**Solution**
- Use that value directly in HTML of the widget.

OR 

- Include a widget with display: none that will give you the bond.

For a more concrete example, please look at the dv file, widget component and usage in the example below.
[DV File](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/livescorecard.dv#L239)
|
[Widget](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/src/components/show-and-edit-competition/show-and-edit-competition.html)
|
[Usage](https://github.com/spderosso/dejavu/blob/master/samples/live-scorecard/src/components/show-and-edit-competition/show-and-edit-competition.html#L47)

## Images <a name="images"></a>
Currently, the platform only allows .png images. 

**Solution**
1. For different types of images, add them to lines [601, 617 and 633](https://github.com/spderosso/dejavu/blob/master/core/mean-loader/src/mean.ts).
2. To use images in a sample application, add the .png file to the desired widget's folder. The image should be copied to the sample's public folder.

For a more concrete example on how to include images, please look at the widget component and usage in the example below.

[Widget](https://github.com/spderosso/dejavu/tree/master/samples/live-scorecard/src/components/banner)
|
[Usage](https://github.com/spderosso/dejavu/blob/76aaeb2881bd8802edba768f8901d164063296fa/samples/live-scorecard/src/components/banner/banner.html#L34)


## `dvAfterInit()` <a name="after"></a>
Scenario: Consider a widget named `ShowClimbs` containing the `ShowAssignedTasks` and `LoggedIn` widgets. The assigner for the `ShowAssignedTasks` widget is not explicitly provided to the widget but rather to its parent widget. `this.assigner.atom_id` returns `undefined` when called anywhere in the `show-climbs.ts`.

**Solution**
1. The `dvAfterInit()` function should contain:
```
dvAfterInit() {
    if (this.<inherited-atom-name>.atom_id) {
        this.fetch();
    }
    this.<inherited-atom-name>.on_change(() => this.fetch());
}
```

2. Create a private function `fetch()` and a private string variable `fetched` like the following:
```
private <data-name> = <>  // [], ""
private fetched: string;

private fetch() {
    if (this.fetched !== this.<inherited-atom-name>.atom_id) {
      this.fetched = this.<inherited-atom-name>.atom_id;
      if (this.<inherited-atom-name>.atom_id) {
        this._graphQlService
          .get(`
                <get-request-name>
            `)
          .map(data => data.<data-collection>)
          .flatMap((<data-collection-name>, _) => Observable.from(<data-collection-name>))
          .map((<cliche-atom-name>: NamedAtom) => {
            const <cliche>_atom = this._clientBus.new_atom<NamedAtom>("<cliche>");
            <cliche>_atom.atom_id = <cliche-atom-name>.atom_id;
            // Map other things like name, date, etc.
            return <cliche-atom-name>;
          })
          .subscribe(<cliche-atom-name> => {
            // if single item
            this.<data-name> = <cliche-atom-name>;
            // else
            this.<data-name>.push(<cliche-atom-name>);
          });
      }
    }
}
```
## Other Warnings <a name="warning"></a>
- Widget names are case sensitive.
- When creating widgets, their names must be unique.
