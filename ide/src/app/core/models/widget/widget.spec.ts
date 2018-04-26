import { Widget, LinkBaseWidget, UserWidget } from './widget';
import { Cliche, UserCliche } from '../cliche/cliche';
import { Project } from '../project/project';

fdescribe('Widget', () => {
  let project: Project;
  let userApp: UserCliche;
  let userAppId: string;

  let widget1: LinkBaseWidget;
  let widget2: UserWidget;
  let widget3: UserWidget;
  let widget4: UserWidget;
  let widget5: LinkBaseWidget;
  let widget6: UserWidget;

  beforeEach(() => {
    project = new Project({name: 'test'});
    userApp = project.userApp;
    userAppId = userApp.getId();

    widget1 = new LinkBaseWidget(
      {name: 'widget1',
      dimensions: {width: 1, height: 1},
      value: {text: '', target: ''},
      clicheId: userAppId});
    userApp.addWidget(widget1);

    widget2 = new UserWidget(
      {name: 'widget2',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId});
    userApp.addWidget(widget2);

    widget3 = new UserWidget(
      {name: 'widget3',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId});
    userApp.addWidget(widget3);

    widget4 = new UserWidget(
      {name: 'widget4',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId});
    userApp.addWidget(widget4);

    widget5 = new LinkBaseWidget(
      {name: 'widget5',
      dimensions: {width: 1, height: 1},
      value: {text: '', target: ''},
      clicheId: userAppId,
      isTemplate: true});
    userApp.addWidget(widget5);

    widget6 = new UserWidget(
      {name: 'widget6',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId,
      isTemplate: true});
    userApp.addWidget(widget6);

    widget3.setAsInnerWidget(userApp, widget6);
  });

  describe('remove', () => {
    it('removes itself from all widgets', () => {
      widget1.remove(userApp);
      expect(userApp.getWidget(widget1.getId())).toBeUndefined();
    });

    it ('does not delete inner widget', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget2.remove(userApp);

      expect(userApp.getWidget(widget2.getId())).toBeUndefined();
      expect(userApp.getWidget(widget1.getId())).toBe(widget1);
    });

    it ('removes itself from its template list', () => {
      const widget6copy = widget6.makeCopy(userApp, undefined, true)[0];
      expect(widget6.isDerivedFromTemplate(widget6copy.getId())).toBe(true);

      widget6copy.remove(userApp);

      expect(widget6.isDerivedFromTemplate(widget6copy.getId())).toBe(false);
    });
  });

  describe('add and remove inner widgets', () => {
    it('adds the id of the added and removes the ids removed', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      expect(widget2.getInnerWidgetIds()).toEqual([widget1.getId()]);

      widget3.setAsInnerWidget(userApp, widget2);
      expect(widget3.getInnerWidgetIds()).toEqual([widget6.getId(), widget2.getId()]);

      widget2.unlinkInnerWidget(userApp, widget1.getId());
      expect(widget2.getInnerWidgetIds()).toEqual([]);

      widget3.unlinkInnerWidget(userApp, widget2.getId());
      expect(widget3.getInnerWidgetIds()).toEqual([widget6.getId()]);
    });

    it ('does not delete removed items', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget2.unlinkInnerWidget(userApp, widget1.getId());

      expect(userApp.getWidget(widget1.getId())).toBe(widget1);
    });
  });

  describe('getPath', () => {
    it('gets all the inner widget ids including the first', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget3.setAsInnerWidget(userApp, widget2);

      expect(widget2.getPath(userApp, widget2.getId()))
      .toEqual([widget2.getId()]);
      expect(widget2.getPath(userApp, widget1.getId()))
      .toEqual([widget2.getId(), widget1.getId()]);
      expect(widget3.getPath(userApp, widget3.getId()))
      .toEqual([widget3.getId()]);
      expect(widget3.getPath(userApp, widget2.getId()))
      .toEqual([widget3.getId(), widget2.getId()]);
      expect(widget3.getPath(userApp, widget1.getId()))
      .toEqual([widget3.getId(), widget2.getId(), widget1.getId()]);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getPath(userApp, widget4.getId()))
      .toBeNull();
    });
  });

  describe('getInnerWidget', () => {
    it ('gets the inner widget', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget3.setAsInnerWidget(userApp, widget2);

      expect(widget2.getInnerWidget(userApp, widget2.getId()))
      .toBe(widget2);
      expect(widget2.getInnerWidget(userApp, widget1.getId()))
      .toBe(widget1);
      expect(widget3.getInnerWidget(userApp, widget3.getId()))
      .toBe(widget3);
      expect(widget3.getInnerWidget(userApp, widget2.getId()))
      .toBe(widget2);
      expect(widget3.getInnerWidget(userApp, widget1.getId()))
      .toBe(widget1);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getInnerWidget(userApp, widget4.getId()))
      .toBeNull();
    });
  });

  describe('fromObject', () => {
    it ('it creates a real widget from BaseWidgets', () => {
      const widget5Copy = Widget.fromJSON(Widget.toJSON(widget5));

      expect(widget5Copy.getId()).toEqual(widget5.getId());
      expect(widget5Copy.isBaseType()).toBe(true);
    });

    it ('it creates a real widget from UserWidgets', () => {
      const widget6Copy = Widget.fromJSON(Widget.toJSON(widget6));

      expect(widget6Copy.getId()).toEqual(widget6.getId());
      expect(widget6Copy.isUserType()).toBe(true);
    });
  });

  describe('makecopy', () => {
    it ('returns all the copied inner widgets', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget3.setAsInnerWidget(userApp, widget2);
      const widget3copies = widget3.makeCopy(userApp);

      expect(widget3copies.length).toBe(4);
      expect(widget3copies[0].getName()).toEqual('widget3');
      expect(widget3copies[0].getClicheId()).toEqual(widget3.getClicheId());
      expect(widget3copies[0].getId()).not.toEqual(widget3.getId());

      expect(widget3copies[1].getName()).toEqual('widget6');
      expect(widget3copies[1].getClicheId()).toEqual(widget6.getClicheId());
      expect(widget3copies[1].getId()).not.toEqual(widget6.getId());

      expect(widget3copies[2].getName()).toEqual('widget2');
      expect(widget3copies[2].getClicheId()).toEqual(widget2.getClicheId());
      expect(widget3copies[2].getId()).not.toEqual(widget2.getId());

      expect(widget3copies[3].getName()).toEqual('widget1');
      expect(widget3copies[3].getClicheId()).toEqual(widget1.getClicheId());
      expect(widget3copies[3].getId()).not.toEqual(widget1.getId());
    });

    it ('not from template of a template creates another template', () => {
      widget6.setAsInnerWidget(userApp, widget5);
      const widget6copies = widget6.makeCopy(userApp);

      expect(widget6copies[0].getTemplateId()).toBeUndefined();
      expect(widget6copies[0].isTemplate()).toBe(true);
      expect(widget6copies[1].getTemplateId()).toBeUndefined();
      expect(widget6copies[1].isTemplate()).toBe(true);
    });

    it ('from template of a template creates a normal widget', () => {
      widget6.setAsInnerWidget(userApp, widget5);
      const widget6copies = widget6.makeCopy(userApp, undefined, true);

      expect(widget6copies[0].getTemplateId()).toEqual(widget6.getId());
      expect(widget6copies[0].isTemplate()).toBe(false);
      expect(widget6copies[1].getTemplateId()).toEqual(widget5.getId());
      expect(widget6copies[1].isTemplate()).toBe(false);
    });
  });

  describe('layout', () => {
    it('copying properly copies over the layout', () => {
      widget2.setAsInnerWidget(userApp, widget1);
      widget1.updatePosition({top: 5, left: 6});

      const widget2Copies = widget2.makeCopy(userApp);
      const widget2Copy = <UserWidget>widget2Copies[0];
      const widget1Copy = widget2Copies[1];
      expect(widget1Copy.getPosition()).toEqual(widget1.getPosition());
    });
  });

  describe('custom styles', () => {
    it('adds and removes styles', () => {
      widget1.updateCustomStyle('background-color', 'red');
      let styles = widget1.getLocalCustomStyles();
      expect(styles['background-color']).toEqual('red');

      widget1.removeCustomStyle('background-color');
      styles = widget1.getLocalCustomStyles();

      expect(styles).toEqual({});
      expect(styles['background-color']).toBeUndefined();
    });

    it('getCustomStylesToShow without templates just gets ' +
    'the same styles', () => {
      widget1.updateCustomStyle('background-color', 'red');
      const styles = widget1.getLocalCustomStyles();

      expect(widget1.getCustomStylesToShow(userApp)).toEqual(styles);
    });

    it('getCustomStylesToShow with template gets template styles ' +
    'but local styles are empty', () => {
      widget6.setAsInnerWidget(userApp, widget5);
      widget6.updateCustomStyle('background-color', 'red');
      const widget6Styles = widget6.getLocalCustomStyles();
      const widgetCopies = widget6.makeCopy(userApp, undefined, true);
      const widget6copy = widgetCopies[0];
      const widget6copyStyles = widget6copy.getLocalCustomStyles();

      expect(widget6copyStyles).toEqual({});
      expect(widget6copy.getCustomStylesToShow(userApp)).toEqual(widget6Styles);

      const widget5Styles1 = widget5.getLocalCustomStyles();
      const widget5copy = widgetCopies[1];
      const widget5copyStyles1 = widget5copy.getLocalCustomStyles();

      expect(widget5copyStyles1).toEqual({});
      expect(widget5copy.getCustomStylesToShow(userApp)).toEqual(widget5Styles1);

      widget5.updateCustomStyle('background-color', 'blue');
      const widget5Styles2 = widget5.getLocalCustomStyles();
      const widget5copyStyles2 = widget5copy.getLocalCustomStyles();

      expect(widget5copyStyles2).toEqual({});
      expect(widget5copy.getCustomStylesToShow(userApp)).toEqual(widget5Styles2);
    });

    it('getCustomStylesToShow double templates can still detech changes ' +
    'in the farthest template', () => {
      const widget5Copies = widget5.makeCopy(userApp, undefined, true);
      const widget5Templatecopy = widget5Copies[0];

      // Widget6 is a template that has a template copy
      widget6.setAsInnerWidget(userApp, widget5Templatecopy);
      const widget6Copies = widget6.makeCopy(userApp, undefined, true);
      const widget5copy = widget6Copies[1];

      widget5.updateCustomStyle('background-color', 'blue');
      const widget5Styles = widget5.getLocalCustomStyles();
      expect(widget5copy.getCustomStylesToShow(userApp)).toEqual(widget5Styles);
    });

    it('getCustomStylesToShow inheritence is parent < template < self',
    () => {
      widget6.updateCustomStyle('background-color', 'red');
      widget6.updateCustomStyle('color', 'red');
      const widget6copy = widget6.makeCopy(userApp, undefined, true)[0];

      widget6copy.updateCustomStyle('color', 'blue');
      widget6copy.updateCustomStyle('font-weight', 'bold');
      const parentStyles = {
        'text-size': '16px',
        'color': 'black',
        'background-color': 'purple'
      };

      const expectedStyles = {
        'text-size': '16px',
        'color': 'blue',
        'background-color': 'red',
        'font-weight': 'bold'
      };

      const styles = widget6copy.getCustomStylesToShow(userApp, parentStyles);

      expect(styles).toEqual(expectedStyles);
    });
  });

  describe('inner widget order switching', () => {
    it('putInnerWidgetOnTop puts the widget on top', () => {
      const widgetIdsInOrder = [
        widget1.getId(),
        widget2.getId(),
        widget3.getId(),
        widget4.getId(),
        widget5.getId()
      ];

      widget6.setAsInnerWidget(userApp, widget1);
      widget6.setAsInnerWidget(userApp, widget2);
      widget6.setAsInnerWidget(userApp, widget3);
      widget6.setAsInnerWidget(userApp, widget4);
      widget6.setAsInnerWidget(userApp, widget5);

      expect(widget6.getInnerWidgetIds()).toEqual(widgetIdsInOrder);

      widget6.putInnerWidgetOnTop(userApp, widget3);
      let expectedOrder = [
        widget1.getId(),
        widget2.getId(),
        widget4.getId(),
        widget5.getId(),
        widget3.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);

      widget6.putInnerWidgetOnTop(userApp, widget1);
      expectedOrder = [
        widget2.getId(),
        widget4.getId(),
        widget5.getId(),
        widget3.getId(),
        widget1.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);

      widget6.putInnerWidgetOnTop(userApp, widget1);
      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);
    });

    it('changeInnerWidgetOrderByOne switches the very first widget', () => {
      const widgetIdsInOrder = [
        widget1.getId(),
        widget2.getId(),
        widget3.getId(),
        widget4.getId(),
        widget5.getId()
      ];

      widget6.setAsInnerWidget(userApp, widget1);
      widget6.setAsInnerWidget(userApp, widget2);
      widget6.setAsInnerWidget(userApp, widget3);
      widget6.setAsInnerWidget(userApp, widget4);
      widget6.setAsInnerWidget(userApp, widget5);

      expect(widget6.getInnerWidgetIds()).toEqual(widgetIdsInOrder);

      const overlap = new Set([widget3.getId(), widget4.getId()]);
      widget6.changeInnerWidgetOrderByOne(userApp, widget1, true, overlap);
      let expectedOrder = [
        widget2.getId(),
        widget3.getId(),
        widget1.getId(),
        widget4.getId(),
        widget5.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);


      widget6.changeInnerWidgetOrderByOne(userApp, widget1, false, overlap);
      expectedOrder = [
        widget2.getId(),
        widget1.getId(),
        widget3.getId(),
        widget4.getId(),
        widget5.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);
    });

    it ('findWidgetsToShift finds overlaping elements and doesn\'t find' +
    'non-overlapping ones', () => {
      const widgetsInOrder = [
        widget1,
        widget2,
        widget3,
        widget4,
        widget5
      ];
      widgetsInOrder.forEach((widget) => {
        widget6.setAsInnerWidget(userApp, widget);
      });

      // 1 and 2 have normal overlap
      widget1.updatePosition({top: 10, left: 10});
      widget1.updateDimensions({height: 20, width: 30});
      widget2.updatePosition({top: 15, left: 15});
      widget2.updateDimensions({height: 20, width: 30});

      // 4 eats up 3 and 5. 3 and 5 only see 4 but not each other.
      widget3.updatePosition({top: 98, left: 98});
      widget4.updatePosition({top: 95, left: 95});
      widget4.updateDimensions({height: 10, width: 10});
      widget5.updatePosition({top: 102, left: 102});

      expect(widget6.findOverlappingWidgets(userApp, widget1))
        .toEqual(new Set([widget2.getId()]));
      expect(widget6.findOverlappingWidgets(userApp, widget2))
        .toEqual(new Set([widget1.getId()]));

      expect(widget6.findOverlappingWidgets(userApp, widget4))
        .toEqual(new Set([widget3.getId(), widget5.getId()]));
      expect(widget6.findOverlappingWidgets(userApp, widget3))
        .toEqual(new Set([widget4.getId()]));
      expect(widget6.findOverlappingWidgets(userApp, widget5))
        .toEqual(new Set([widget4.getId()]));
    });
  });
});