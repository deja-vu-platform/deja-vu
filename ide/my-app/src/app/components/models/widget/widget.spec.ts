import { WidgetType, Widget, BaseWidget, UserWidget } from './widget';

describe('UserWidget', () => {
  const clicheid = '1234';
  let allWidgets: Map<string, Map<string, Widget>>;
  let widget1: BaseWidget;
  let widget2: UserWidget;
  let widget3: UserWidget;
  let widget4: UserWidget;
  let widget5: BaseWidget;
  let widget6: UserWidget;

  beforeEach(() => {
    allWidgets = new Map<string, Map<string, Widget>>();
    widget1 = new BaseWidget('widget1', {width: 10, height: 10}, 'img', '/', clicheid);
    widget2 = new UserWidget('widget2', {width: 20, height: 20}, clicheid);
    widget3 = new UserWidget('widget3', {width: 20, height: 20}, clicheid);

    widget4 = new UserWidget('widget4', {width: 20, height: 20}, '123123');

    widget5 = new BaseWidget('widget5', {width: 10, height: 10}, 'img', '/', clicheid, null, null, true);
    widget6 = new UserWidget('widget6', {width: 10, height: 10}, clicheid, null, null, true);

    Widget.addWidgetToAllWidgets(allWidgets, widget1);
    Widget.addWidgetToAllWidgets(allWidgets, widget2);
    Widget.addWidgetToAllWidgets(allWidgets, widget3);
    Widget.addWidgetToAllWidgets(allWidgets, widget4);
    Widget.addWidgetToAllWidgets(allWidgets, widget5);
    Widget.addWidgetToAllWidgets(allWidgets, widget6);
  });

  describe('add and delete', () => {
    it('adds the id of the added and removes the ids removed', () => {
      widget2.addInnerWidget(widget1.getId());
      expect(widget2.getInnerWidgets()).toEqual([widget1.getId()]);

      widget3.addInnerWidget(widget2.getId());
      expect(widget3.getInnerWidgets()).toEqual([widget2.getId()]);

      widget2.removeInnerWidget(widget1.getId());
      expect(widget2.getInnerWidgets()).toEqual([]);

      widget3.removeInnerWidget(widget2.getId());
      expect(widget3.getInnerWidgets()).toEqual([]);
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
    it('properly updates the layout', () => {
      widget2.addInnerWidget(widget1.getId());
      const newPosition = {top: 5, left: 6};
      widget2.updateInnerWidgetLayout(widget1.getId(), newPosition);

      expect(widget2.getInnerWidgetLayouts()[widget1.getId()])
      .toEqual(newPosition);
    });

    it('copying properly copies over the layout', () => {
      widget2.addInnerWidget(widget1.getId());
      const newPosition = {top: 5, left: 6};
      widget2.updateInnerWidgetLayout(widget1.getId(), newPosition);

      const widget2Copies = widget2.makeCopy(allWidgets);
      const widget2Copy = <UserWidget>widget2Copies[0];
      const widget1Copy = widget2Copies[1];
      expect(widget2Copy.getInnerWidgetLayouts()[widget1Copy.getId()]).toEqual(newPosition);
    });
  });

  describe('custom styles', () => {
    it('adds and removes styles', () => {
      widget1.updateCustomStyle('background-color', 'red');
      let styles = widget1.getCustomStyles();
      expect(styles['background-color']).toEqual('red');

      widget1.removeCustomStyle('background-color');
      styles = widget1.getCustomStyles();

      expect(styles).toEqual({});
      expect(styles['background-color']).toBe(undefined);
    });

    it('getCustomStylesWithInherits without templates just gets' +
    ' the same styles', () => {
      widget1.updateCustomStyle('background-color', 'red');
      const styles = widget1.getCustomStyles();

      expect(widget1.getCustomStylesWithInherits(allWidgets)).toEqual(styles);
    });

    it('getCustomStylesWithInherits with template gets no style of its own',
    () => {
      widget6.updateCustomStyle('background-color', 'red');
      const widget6Styles = widget6.getCustomStyles();
      const widget6copy = widget6.makeCopy(allWidgets, true)[0];
      const widget6copyStyles = widget6copy.getCustomStyles();

      expect(widget6copyStyles).toEqual({});
      expect(widget6copy.getCustomStylesWithInherits(allWidgets)).toEqual(widget6Styles);
    });

  });
});
