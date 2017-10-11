import { WidgetType, Widget, BaseWidget, UserWidget } from './widget';

describe('UserWidget', () => {
  const clicheid = '1234';
  let allWidgetsInCliche: Map<string, Widget>;
  let allWidgets: Map<string, Map<string, Widget>>;
  let widget1: BaseWidget;
  let widget2: UserWidget;
  let widget3: UserWidget;
  let widget4: UserWidget;

  beforeEach(() => {
    allWidgetsInCliche = new Map<string, Widget>();
    allWidgets = new Map<string, Map<string, Widget>>();
    widget1 = new BaseWidget('widget1', {width: 10, height: 10}, 'img', '/', clicheid);
    widget2 = new UserWidget('widget2', {width: 20, height: 20}, clicheid);
    widget3 = new UserWidget('widget3', {width: 20, height: 20}, clicheid);

    widget4 = new UserWidget('widget3', {width: 20, height: 20}, '123123');
    allWidgetsInCliche[widget1.getId()] = widget1;
    allWidgetsInCliche[widget2.getId()] = widget2;
    allWidgetsInCliche[widget3.getId()] = widget3;

    allWidgets[clicheid] = allWidgetsInCliche;
  });

  it('add and delete', () => {
    widget2.addInnerWidget(widget1.getId());
    expect(widget2.getInnerWidgets()).toEqual([widget1.getId()]);

    widget3.addInnerWidget(widget2.getId());
    expect(widget3.getInnerWidgets()).toEqual([widget2.getId()]);

    widget2.removeInnerWidget(widget1.getId());
    expect(widget2.getInnerWidgets()).toEqual([]);

    widget3.removeInnerWidget(widget2.getId());
    expect(widget3.getInnerWidgets()).toEqual([]);
  });

  it('getPath', () => {
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

    expect(widget3.getPath(allWidgets, widget4.getId()))
    .toBeNull();
  });

  it ('getInnerWidget', () => {
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

    expect(widget3.getInnerWidget(allWidgets, widget4.getId()))
    .toBeNull();
  });

  it ('fromObject', () => {
    const widget2Copy = Widget.fromObject(JSON.parse(JSON.stringify(widget2)));

    expect(widget2Copy.getId()).toEqual(widget2.getId());
    expect(widget2Copy.getWidgetType()).toEqual(WidgetType.USER_WIDGET);
  });
});
