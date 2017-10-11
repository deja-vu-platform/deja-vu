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

    widget5 = new BaseWidget('widget5', {width: 10, height: 10}, 'img', '/', clicheid);
    widget6 = new UserWidget('widget6', {width: 10, height: 10}, clicheid);

    Widget.addWidgetToAllWidgets(allWidgets, widget1);
    Widget.addWidgetToAllWidgets(allWidgets, widget2);
    Widget.addWidgetToAllWidgets(allWidgets, widget3);
    Widget.addWidgetToAllWidgets(allWidgets, widget4);
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
      expect(widget3copies[1].getName()).toEqual('widget2');
      expect(widget3copies[2].getName()).toEqual('widget1');
    });
  });
});
