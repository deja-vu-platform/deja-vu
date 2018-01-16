import { Widget, LinkBaseWidget, UserWidget } from '../widget/widget';
import { Cliche, UserCliche } from './cliche';
import { Project } from '../project/project';

fdescribe('UserCliche', () => {
  let project: Project;
  let userApp: UserCliche;
  let userAppId: string;

  let widget1: LinkBaseWidget;
  let widget2: UserWidget;
  let widget3: UserWidget;
  let nonUserAppWidget: UserWidget;

  beforeEach(() => {
    project = new Project({name: 'test'});
    userApp = project.userApp;
    userAppId = userApp.getId();

    widget1 = new LinkBaseWidget(
      {name: 'widget1',
      dimensions: {width: 1, height: 1},
      value: {text: '', target: ''},
      clicheId: userAppId},
      project);

    widget2 = new UserWidget(
      {name: 'widget2',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId},
      project);

    widget3 = new UserWidget(
      {name: 'widget3',
      dimensions: {width: 1, height: 1},
      clicheId: userAppId},
      project);

    nonUserAppWidget = new UserWidget(
      {name: 'widget6',
      dimensions: {width: 1, height: 1},
      clicheId: 'notUserAppId',
      isTemplate: true},
      project);
  });

  // static fromJSON(fields: UserClicheFields, project: Project) {

  // constructor (fields: UserClicheFields, project: Project) {

  describe('fromJSON and toJSON', () => {
    it ('can be used to create a copy of the cliche', () => {
      const widget4 = new LinkBaseWidget(
        {name: 'widget4',
        dimensions: {width: 1, height: 1},
        value: {text: '', target: ''},
        clicheId: userAppId},
        project);

      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);
      userApp.addWidget(widget4);

      userApp.setAsPage(widget1);
      userApp.setAsTemplate(widget2);
      userApp.setAsInnerWidget(widget3);

      const userAppJSON = Cliche.toJSON(userApp);
      const userAppCopy = UserCliche.fromJSON(userAppJSON, project);

      expect(userAppCopy.getId()).toEqual(userApp.getId());
      expect(userAppCopy.getName()).toEqual(userApp.getName());
      expect(userAppCopy.getFreeWidgetIds())
        .toEqual(userApp.getFreeWidgetIds());
      expect(userAppCopy.getInnerWidgetIds())
        .toEqual(userApp.getInnerWidgetIds());
      expect(userAppCopy.getPageIds())
        .toEqual(userApp.getPageIds());
      expect(userAppCopy.getInnerWidgetIds())
        .toEqual(userApp.getInnerWidgetIds());
    });

    it ('the copies objects are not the same object', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      const userAppJSON = Cliche.toJSON(userApp);
      const userAppCopy = UserCliche.fromJSON(userAppJSON, project);

      expect(userAppCopy).not.toBe(userApp);
      expect(userApp.getWidget(widget1.getId())).toBe(widget1);
      expect(userAppCopy.getWidget(widget1.getId())).not.toBe(widget1);
      expect(userApp.getWidget(widget2.getId())).toBe(widget2);
      expect(userAppCopy.getWidget(widget2.getId())).not.toBe(widget2);
      expect(userApp.getWidget(widget3.getId())).toBe(widget3);
      expect(userAppCopy.getWidget(widget3.getId())).not.toBe(widget3);
    });
  });

  describe('add', () => {
    it('initially cannot find an unadded widget but finds it once added',
      () => {
        expect(userApp.getWidget(widget1.getId())).toBeUndefined();

        userApp.addWidget(widget1);
        expect(userApp.getWidget(widget1.getId())).toBe(widget1);
      });

    it('adds the widget as a free widget',
      () => {
        userApp.addWidget(widget1);
        expect(userApp.getFreeWidgetIds()).toEqual([widget1.getId()]);
      });

    it('throws an error if trying to add a widget without a matching' +
      'cliche id',  () => {
        expect(() => {userApp.addWidget(nonUserAppWidget); }).toThrowError();
      });
  });

  describe('remove', () => {
    it('removes the added widget',
      () => {
        expect(userApp.getWidget(widget1.getId())).toBeUndefined();

        userApp.addWidget(widget1);
        expect(userApp.getWidget(widget1.getId())).toBe(widget1);

        userApp.removeWidget(widget1.getId());

        expect(userApp.getWidget(widget1.getId())).toBeUndefined();
      });
  });

  describe('page functions', () => {
    it ('sets a widget as a page properly', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      expect(userApp.isPage(widget1.getId())).toBe(false);
      expect(userApp.isPage(widget2.getId())).toBe(false);
      expect(userApp.isPage(widget3.getId())).toBe(false);
      expect(userApp.numPages()).toBe(0);
      expect(userApp.getPageIds()).toEqual([]);

      userApp.setAsPage(widget1);
      expect(userApp.isPage(widget1.getId())).toBe(true);
      expect(userApp.isPage(widget2.getId())).toBe(false);
      expect(userApp.isPage(widget3.getId())).toBe(false);
      expect(userApp.numPages()).toBe(1);
      expect(userApp.getPageIds()).toEqual([widget1.getId()]);

      userApp.setAsPage(widget2);
      expect(userApp.isPage(widget1.getId())).toBe(true);
      expect(userApp.isPage(widget2.getId())).toBe(true);
      expect(userApp.isPage(widget3.getId())).toBe(false);
      expect(userApp.numPages()).toBe(2);
      expect(userApp.getPageIds().sort()).
        toEqual([widget1.getId(), widget2.getId()].sort());
    });
  });

  describe('templates functions', () => {
    it ('sets a widget as a template properly', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      expect(userApp.getTemplateIds()).toEqual([]);

      userApp.setAsTemplate(widget1);
      expect(userApp.getTemplateIds()).toEqual([widget1.getId()]);

      userApp.setAsTemplate(widget2);
      expect(userApp.getTemplateIds().sort())
        .toEqual([widget1.getId(), widget2.getId()].sort());
    });
  });

  describe('inner widgets functions', () => {
    it ('sets a widget as a inner widget properly', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      expect(userApp.getInnerWidgetIds()).toEqual([]);

      userApp.setAsInnerWidget(widget1);
      expect(userApp.getInnerWidgetIds()).toEqual([widget1.getId()]);

      userApp.setAsInnerWidget(widget2);
      expect(userApp.getInnerWidgetIds().sort())
        .toEqual([widget1.getId(), widget2.getId()].sort());
    });
  });

  describe('free widgets functions', () => {
    it ('initally adds all widgets as free and that later get used up', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      expect(userApp.getFreeWidgetIds().sort())
        .toEqual([widget1.getId(), widget2.getId(), widget3.getId()].sort());

      userApp.setAsPage(widget1);
      expect(userApp.getFreeWidgetIds().sort())
        .toEqual([widget2.getId(), widget3.getId()].sort());

      userApp.setAsTemplate(widget2);
      expect(userApp.getFreeWidgetIds()).toEqual([widget3.getId()]);
    });

    it ('can free up used widgets', () => {
      userApp.addWidget(widget1);
      userApp.addWidget(widget2);
      userApp.addWidget(widget3);

      expect(userApp.getFreeWidgetIds().sort())
        .toEqual([widget1.getId(), widget2.getId(), widget3.getId()].sort());

      userApp.setAsPage(widget1);
      expect(userApp.getFreeWidgetIds().sort()).
        toEqual([widget2.getId(), widget3.getId()].sort());

      userApp.setAsFreeWidget(widget1);
      expect(userApp.getFreeWidgetIds().sort()).
        toEqual([widget1.getId(), widget2.getId(), widget3.getId()].sort());
    });
  });
});
