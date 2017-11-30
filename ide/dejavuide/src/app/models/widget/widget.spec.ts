import { Widget, LinkBaseWidget, UserWidget } from './widget';
import { Cliche, UserCliche } from '../cliche/cliche';
import { Project } from '../project/project';

fdescribe('UserWidget', () => {
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
    project = new Project('test');
    userApp = project.userApp;
    userAppId = userApp.getId();

    widget1 = new LinkBaseWidget(project, 'widget1', {width: 1, height: 1}, '/', userAppId);
    widget2 = new UserWidget(project, 'widget2', {width: 1, height: 1}, userAppId);
    widget3 = new UserWidget(project, 'widget3', {width: 1, height: 1}, userAppId);

    widget4 = new UserWidget(project, 'widget4', {width: 1, height: 1}, userAppId);

    widget5 = new LinkBaseWidget(project, 'widget5', {width: 1, height: 1}, '/', userAppId, null, null, true);
    widget6 = new UserWidget(project, 'widget6', {width: 1, height: 1}, userAppId, null, null, true);
  });

  describe('remove', () => {
    it('removes itself from all widgets', () => {
      widget1.remove();
      expect(() => project.getAppWidget(widget1.getId())).toThrowError();
    });

    it ('does not delete inner widget', () => {
      widget2.addInnerWidget(widget1);
      widget2.remove();

      expect(() => project.getAppWidget(widget2.getId())).toThrowError();
      expect(project.getAppWidget(widget1.getId())).toBe(widget1);
    });

    it ('removes itself from its template list', () => {
      const widget6copy = widget6.makeCopy(true)[0];
      expect(widget6.isDerivedFromTemplate(widget6copy.getId())).toBe(true);

      widget6copy.remove();

      expect(widget6.isDerivedFromTemplate(widget6copy.getId())).toBe(false);
    });
  });

  describe('add and remove inner widgets', () => {
    it('adds the id of the added and removes the ids removed', () => {
      widget2.addInnerWidget(widget1);
      expect(widget2.getInnerWidgetIds()).toEqual([widget1.getId()]);

      widget3.addInnerWidget(widget2);
      expect(widget3.getInnerWidgetIds()).toEqual([widget2.getId()]);

      widget2.removeInnerWidget(widget1.getId());
      expect(widget2.getInnerWidgetIds()).toEqual([]);

      widget3.removeInnerWidget(widget2.getId());
      expect(widget3.getInnerWidgetIds()).toEqual([]);
    });

    it ('does not delete removed items', () => {
      widget2.addInnerWidget(widget1);
      widget2.removeInnerWidget(widget1.getId());

      expect(project.getAppWidget(widget1.getId())).toBe(widget1);
    });
  });

  describe('getPath', () => {
    it('gets all the inner widget ids including the first', () => {
      widget2.addInnerWidget(widget1);
      widget3.addInnerWidget(widget2);

      expect(widget2.getPath(widget2.getId()))
      .toEqual([widget2.getId()]);
      expect(widget2.getPath(widget1.getId()))
      .toEqual([widget2.getId(), widget1.getId()]);
      expect(widget3.getPath(widget3.getId()))
      .toEqual([widget3.getId()]);
      expect(widget3.getPath(widget2.getId()))
      .toEqual([widget3.getId(), widget2.getId()]);
      expect(widget3.getPath(widget1.getId()))
      .toEqual([widget3.getId(), widget2.getId(), widget1.getId()]);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getPath(widget4.getId()))
      .toBeNull();
    });
  });

  describe('getInnerWidget', () => {
    it ('gets the inner widget', () => {
      widget2.addInnerWidget(widget1);
      widget3.addInnerWidget(widget2);

      expect(widget2.getInnerWidget(widget2.getId()))
      .toBe(widget2);
      expect(widget2.getInnerWidget(widget1.getId()))
      .toBe(widget1);
      expect(widget3.getInnerWidget(widget3.getId()))
      .toBe(widget3);
      expect(widget3.getInnerWidget(widget2.getId()))
      .toBe(widget2);
      expect(widget3.getInnerWidget(widget1.getId()))
      .toBe(widget1);
    });

    it ('returns null if there is no path', () => {
      expect(widget3.getInnerWidget(widget4.getId()))
      .toBeNull();
    });
  });

  describe('fromObject', () => {
    it ('it creates a real widget from BaseWidgets', () => {
      const widget5Copy = Widget.fromObject(project, widget5.getSaveableJson());

      expect(widget5Copy.getId()).toEqual(widget5.getId());
      expect(widget5Copy.isBaseType()).toBe(true);
    });

    it ('it creates a real widget from UserWidgets', () => {
      const widget6Copy = Widget.fromObject(project, widget6.getSaveableJson());

      expect(widget6Copy.getId()).toEqual(widget6.getId());
      expect(widget6Copy.isUserType()).toBe(true);
    });
  });

  describe('makecopy', () => {
    it ('returns all the copied inner widgets', () => {
      widget2.addInnerWidget(widget1);
      widget3.addInnerWidget(widget2);
      const widget3copies = widget3.makeCopy();

      expect(widget3copies.length).toBe(3);
      expect(widget3copies[0].getName()).toEqual('widget3');
      expect(widget3copies[0].getClicheId()).toEqual(widget3.getClicheId());
      expect(widget3copies[1].getName()).toEqual('widget2');
      expect(widget3copies[1].getClicheId()).toEqual(widget2.getClicheId());
      expect(widget3copies[2].getName()).toEqual('widget1');
      expect(widget3copies[2].getClicheId()).toEqual(widget1.getClicheId());
    });

    it ('from template of a non-template does nothing', () => {
      const widget3copies = widget3.makeCopy(true);
      const widget3copy = widget3copies[0];

      expect(widget3copy.getTemplateId()).toBeNull();
      expect(widget3copy.isTemplate()).toBe(false);
    });

    it ('not from template of a template creates another template', () => {
      widget6.addInnerWidget(widget5);
      const widget6copies = widget6.makeCopy();

      expect(widget6copies[0].getTemplateId()).toBeNull();
      expect(widget6copies[0].isTemplate()).toBe(true);
      expect(widget6copies[1].getTemplateId()).toBeNull();
      expect(widget6copies[1].isTemplate()).toBe(true);
    });

    it ('from template of a template creates a normal widget', () => {
      widget6.addInnerWidget(widget5);
      const widget6copies = widget6.makeCopy(true);

      expect(widget6copies[0].getTemplateId()).toEqual(widget6.getId());
      expect(widget6copies[0].isTemplate()).toBe(false);
      expect(widget6copies[1].getTemplateId()).toEqual(widget5.getId());
      expect(widget6copies[1].isTemplate()).toBe(false);
    });
  });

  describe('layout', () => {
    it('copying properly copies over the layout', () => {
      widget2.addInnerWidget(widget1);
      widget1.updatePosition({top: 5, left: 6});

      const widget2Copies = widget2.makeCopy();
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

      expect(widget1.getCustomStylesToShow()).toEqual(styles);
    });

    it('getCustomStylesToShow with template gets template styles ' +
    'but local styles are empty', () => {
      widget6.updateCustomStyle('background-color', 'red');
      const widget6Styles = widget6.getLocalCustomStyles();
      const widget6copy = widget6.makeCopy(true)[0];
      const widget6copyStyles = widget6copy.getLocalCustomStyles();

      expect(widget6copyStyles).toEqual({});
      expect(widget6copy.getCustomStylesToShow()).toEqual(widget6Styles);
    });

    it('getCustomStylesToShow inheritence is parent < template < self',
    () => {
      widget6.updateCustomStyle('background-color', 'red');
      widget6.updateCustomStyle('color', 'red');
      const widget6copy = widget6.makeCopy(true)[0];

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

      const styles = widget6copy.getCustomStylesToShow(parentStyles);

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

      widget6.addInnerWidget(widget1);
      widget6.addInnerWidget(widget2);
      widget6.addInnerWidget(widget3);
      widget6.addInnerWidget(widget4);
      widget6.addInnerWidget(widget5);

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

      widget6.addInnerWidget(widget1);
      widget6.addInnerWidget(widget2);
      widget6.addInnerWidget(widget3);
      widget6.addInnerWidget(widget4);
      widget6.addInnerWidget(widget5);

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
      const widgetsInOrder = [
        widget1,
        widget2,
        widget3,
        widget4,
        widget5
      ];
      widgetsInOrder.forEach((widget) => {
        widget6.addInnerWidget(widget);
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

      expect(widget6.findOverlappingWidgets(widget1))
        .toEqual(new Set([widget2.getId()]));
      expect(widget6.findOverlappingWidgets(widget2))
        .toEqual(new Set([widget1.getId()]));

      expect(widget6.findOverlappingWidgets(widget4))
        .toEqual(new Set([widget3.getId(), widget5.getId()]));
      expect(widget6.findOverlappingWidgets(widget3))
        .toEqual(new Set([widget4.getId()]));
      expect(widget6.findOverlappingWidgets(widget5))
        .toEqual(new Set([widget4.getId()]));
    });
  });
});
