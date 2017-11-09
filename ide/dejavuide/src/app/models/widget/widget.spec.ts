import { WidgetType, Widget, BaseWidget, UserWidget, WidgetMap } from './widget';

describe('UserWidget', () => {
  const clicheid = '1234';
  let allWidgets: WidgetMap;
  let widget1: BaseWidget;
  let widget2: UserWidget;
  let widget3: UserWidget;
  let widget4: UserWidget;
  let widget5: BaseWidget;
  let widget6: UserWidget;

  beforeEach(() => {
    allWidgets = new Map<string, Map<string, Widget>>();
    widget1 = new BaseWidget('widget1', {width: 1, height: 1}, 'img', '/', clicheid);
    widget2 = new UserWidget('widget2', {width: 1, height: 1}, clicheid);
    widget3 = new UserWidget('widget3', {width: 1, height: 1}, clicheid);

    widget4 = new UserWidget('widget4', {width: 1, height: 1}, '123123');

    widget5 = new BaseWidget('widget5', {width: 1, height: 1}, 'img', '/', clicheid, null, null, true);
    widget6 = new UserWidget('widget6', {width: 1, height: 1}, clicheid, null, null, true);

    Widget.addWidgetToAllWidgets(allWidgets, widget1);
    Widget.addWidgetToAllWidgets(allWidgets, widget2);
    Widget.addWidgetToAllWidgets(allWidgets, widget3);
    Widget.addWidgetToAllWidgets(allWidgets, widget4);
    Widget.addWidgetToAllWidgets(allWidgets, widget5);
    Widget.addWidgetToAllWidgets(allWidgets, widget6);
  });

  describe('delete', () => {
    it('removes itself from all widgets', () => {
      widget1.delete(allWidgets);
      expect(Widget.getWidget(allWidgets, widget1.getId())).toBe(undefined);
    });

    it ('does not delete inner widget', () => {
      widget2.addInnerWidget(widget1.getId());
      widget2.delete(allWidgets);

      expect(Widget.getWidget(allWidgets, widget2.getId())).toBe(undefined);
      expect(Widget.getWidget(allWidgets, widget1.getId())).toBe(widget1);
    });

    it ('removes itself from its template list', () => {
      const widget6copy = widget6.makeCopy(allWidgets, true)[0];

      expect(widget6.getIsTemplateCopy(widget6copy.getId())).toBe(true);

      widget6copy.delete(allWidgets);

      expect(widget6.getIsTemplateCopy(widget6copy.getId())).toBe(false);
    });
  });

  describe('add and remove inner widgets', () => {
    it('adds the id of the added and removes the ids removed', () => {
      widget2.addInnerWidget(widget1.getId());
      expect(widget2.getInnerWidgetIds()).toEqual([widget1.getId()]);

      widget3.addInnerWidget(widget2.getId());
      expect(widget3.getInnerWidgetIds()).toEqual([widget2.getId()]);

      widget2.removeInnerWidget(widget1.getId());
      expect(widget2.getInnerWidgetIds()).toEqual([]);

      widget3.removeInnerWidget(widget2.getId());
      expect(widget3.getInnerWidgetIds()).toEqual([]);
    });

    it ('does not delete removed items', () => {
      widget2.addInnerWidget(widget1.getId());
      widget2.removeInnerWidget(widget1.getId());

      expect(Widget.getWidget(allWidgets, widget1.getId())).toBe(widget1);
    });
  });

  describe('getPath', () => {
    it('gets all the inner widget ids including the first', () => {
      widget2.addInnerWidget(widget1.getId());
      widget3.addInnerWidget(widget2.getId());

      expect(widget2.getPath(allWidgets, widget2.getId()))
      .toEqual([widget2.getId()]);
      expect(widget2.getPath(allWidgets, widget1.getId()))
      .toEqual([widget2.getId(), widget1.getId()]);
      expect(widget3.getPath(allWidgets, widget3.getId()))
      .toEqual([widget3.getId()]);
      expect(widget3.getPath(allWidgets, widget2.getId()))
      .toEqual([widget3.getId(), widget2.getId()]);
      expect(widget3.getPath(allWidgets, widget1.getId()))
      .toEqual([widget3.getId(), widget2.getId(), widget1.getId()]);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getPath(allWidgets, widget4.getId()))
      .toBeNull();
    });
  });

  describe('getInnerWidget', () => {
    it ('gets the inner widget', () => {
      widget2.addInnerWidget(widget1.getId());
      widget3.addInnerWidget(widget2.getId());

      expect(widget2.getInnerWidget(allWidgets, widget2.getId()))
      .toBe(widget2);
      expect(widget2.getInnerWidget(allWidgets, widget1.getId()))
      .toBe(widget1);
      expect(widget3.getInnerWidget(allWidgets, widget3.getId()))
      .toBe(widget3);
      expect(widget3.getInnerWidget(allWidgets, widget2.getId()))
      .toBe(widget2);
      expect(widget3.getInnerWidget(allWidgets, widget1.getId()))
      .toBe(widget1);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getInnerWidget(allWidgets, widget4.getId()))
      .toBeNull();
    });
  });

  describe('fromObject', () => {
    it ('it creates a real widget from BaseWidgets', () => {
      const widget5Copy = Widget.fromObject(JSON.parse(JSON.stringify(widget5)));

      expect(widget5Copy.getId()).toEqual(widget5.getId());
      expect(widget5Copy.getWidgetType()).toEqual(WidgetType.BASE_WIDGET);
    });

    it ('it creates a real widget from UserWidgets', () => {
      const widget6Copy = Widget.fromObject(JSON.parse(JSON.stringify(widget6)));

      expect(widget6Copy.getId()).toEqual(widget6.getId());
      expect(widget6Copy.getWidgetType()).toEqual(WidgetType.USER_WIDGET);
    });
  });


  describe('makecopy', () => {
    it ('returns all the copied inner widgets', () => {
      widget2.addInnerWidget(widget1.getId());
      widget3.addInnerWidget(widget2.getId());
      const widget3copies = widget3.makeCopy(allWidgets);

      expect(widget3copies.length).toBe(3);
      expect(widget3copies[0].getName()).toEqual('widget3');
      expect(widget3copies[0].getClicheId()).toEqual(widget3.getClicheId());
      expect(widget3copies[1].getName()).toEqual('widget2');
      expect(widget3copies[1].getClicheId()).toEqual(widget2.getClicheId());
      expect(widget3copies[2].getName()).toEqual('widget1');
      expect(widget3copies[2].getClicheId()).toEqual(widget1.getClicheId());
    });

    it ('from template of a non-template does nothing', () => {
      const widget3copies = widget3.makeCopy(allWidgets, true);
      const widget3copy = widget3copies[0];

      expect(widget3copy.getTemplateId()).toBeNull();
      expect(widget3copy.getIsTemplate()).toBe(false);
    });

    it ('not from template of a template creates another template', () => {
      widget6.addInnerWidget(widget5.getId());
      const widget6copies = widget6.makeCopy(allWidgets);

      expect(widget6copies[0].getTemplateId()).toBeNull();
      expect(widget6copies[0].getIsTemplate()).toBe(true);
      expect(widget6copies[1].getTemplateId()).toBeNull();
      expect(widget6copies[1].getIsTemplate()).toBe(true);
    });

    it ('from template of a template creates a normal widget', () => {
      widget6.addInnerWidget(widget5.getId());
      const widget6copies = widget6.makeCopy(allWidgets, true);

      expect(widget6copies[0].getTemplateId()).toEqual(widget6.getId());
      expect(widget6copies[0].getIsTemplate()).toBe(false);
      expect(widget6copies[1].getTemplateId()).toEqual(widget5.getId());
      expect(widget6copies[1].getIsTemplate()).toBe(false);
    });
  });

  describe('layout', () => {
    it('copying properly copies over the layout', () => {
      widget2.addInnerWidget(widget1.getId());
      widget1.updatePosition({top: 5, left: 6});

      const widget2Copies = widget2.makeCopy(allWidgets);
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
      expect(styles['background-color']).toBe(undefined);
    });

    it('getCustomStylesToShow without templates just gets ' +
    'the same styles', () => {
      widget1.updateCustomStyle('background-color', 'red');
      const styles = widget1.getLocalCustomStyles();

      expect(widget1.getCustomStylesToShow(allWidgets)).toEqual(styles);
    });

    it('getCustomStylesToShow with template gets template styles ' +
    'but local styles are empty', () => {
      widget6.updateCustomStyle('background-color', 'red');
      const widget6Styles = widget6.getLocalCustomStyles();
      const widget6copy = widget6.makeCopy(allWidgets, true)[0];
      const widget6copyStyles = widget6copy.getLocalCustomStyles();

      expect(widget6copyStyles).toEqual({});
      expect(widget6copy.getCustomStylesToShow(allWidgets)).toEqual(widget6Styles);
    });

    it('getCustomStylesToShow inheritence is parent < template < self',
    () => {
      widget6.updateCustomStyle('background-color', 'red');
      widget6.updateCustomStyle('color', 'red');
      const widget6copy = widget6.makeCopy(allWidgets, true)[0];
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

      const styles = widget6copy
                      .getCustomStylesToShow(allWidgets, parentStyles);

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
      widgetIdsInOrder.forEach((id) => {
        widget6.addInnerWidget(id);
      });

      expect(widget6.getInnerWidgetIds()).toEqual(widgetIdsInOrder);

      widget6.putInnerWidgetOnTop(widget3.getId());
      let expectedOrder = [
        widget1.getId(),
        widget2.getId(),
        widget4.getId(),
        widget5.getId(),
        widget3.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);

      widget6.putInnerWidgetOnTop(widget1.getId());
      expectedOrder = [
        widget2.getId(),
        widget4.getId(),
        widget5.getId(),
        widget3.getId(),
        widget1.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);

      widget6.putInnerWidgetOnTop(widget1.getId());
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
      widgetIdsInOrder.forEach((id) => {
        widget6.addInnerWidget(id);
      });

      expect(widget6.getInnerWidgetIds()).toEqual(widgetIdsInOrder);

      const overlap = new Set([widget3.getId(), widget4.getId()]);
      widget6.changeInnerWidgetOrderByOne(widget1.getId(), overlap);
      let expectedOrder = [
        widget2.getId(),
        widget3.getId(),
        widget1.getId(),
        widget4.getId(),
        widget5.getId()
      ];

      expect(widget6.getInnerWidgetIds()).toEqual(expectedOrder);


      widget6.changeInnerWidgetOrderByOne(widget1.getId(), overlap, false);
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
      const widgetIdsInOrder = [
        widget1.getId(),
        widget2.getId(),
        widget3.getId(),
        widget4.getId(),
        widget5.getId()
      ];
      widgetIdsInOrder.forEach((id) => {
        widget6.addInnerWidget(id);
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

      expect(widget6.findOverlappingWidgets(allWidgets, widget1))
        .toEqual(new Set([widget2.getId()]));
      expect(widget6.findOverlappingWidgets(allWidgets, widget2))
        .toEqual(new Set([widget1.getId()]));

      expect(widget6.findOverlappingWidgets(allWidgets, widget4))
        .toEqual(new Set([widget3.getId(), widget5.getId()]));
      expect(widget6.findOverlappingWidgets(allWidgets, widget3))
        .toEqual(new Set([widget4.getId()]));
      expect(widget6.findOverlappingWidgets(allWidgets, widget5))
        .toEqual(new Set([widget4.getId()]));
    });
  });
});
