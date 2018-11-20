import { WidgetDirective } from './widget.directive';

describe('WidgetDirective', () => {
  it('should create an instance', () => {
    // TODO: viewContainerRef argument
    const directive = new WidgetDirective(null);
    expect(directive)
      .toBeTruthy();
  });
});
