import { ComponentSymbolTable } from '../symbolTable';
import {
  CompiledComponentInput, ComponentInputCompiler
} from './component-input.compiler';


describe('ComponentInputCompiler', () => {
  let componentInputCompiler: ComponentInputCompiler;

  beforeEach(() => {
    componentInputCompiler = new ComponentInputCompiler();
  });

  it('should compile component input with HTML only', () => {
    const componentInput = `<h1>Hello</h1>`;
    const compiledComponentInput: CompiledComponentInput = componentInputCompiler
      .compile(componentInput, {});
    expect(compiledComponentInput.component)
      .toMatch('Hello');
    expect(compiledComponentInput.component)
      .toMatch('dv.component');
  });

  it('should compile wrapped component input with HTML only', () => {
    const componentInput = `<dv.component><h1>Hello</h1></dv.component>`;
    const compiledComponentInput: CompiledComponentInput = componentInputCompiler
      .compile(componentInput, {});
    expect(compiledComponentInput.component)
      .toMatch('Hello');
    expect(compiledComponentInput.component)
      .toMatch('dv.component');
  });

  it('should compile component with capture', () => {
    const componentInput = `<event.show-event event=foo.show-bar.loadedBar />`;
    const context: ComponentSymbolTable = {
      foo: {
        kind: 'concept',
        symbolTable: {
          'show-bar': {
            kind: 'component'
          }
        }
      }
    };
    const compiledComponentInput: CompiledComponentInput = componentInputCompiler
      .compile(componentInput, context);
    expect(compiledComponentInput.component)
      .toMatch('event.show-event');
    expect(compiledComponentInput.component)
      .toMatch('dv.component');
    expect(compiledComponentInput.component)
      .toMatch(/event=\$capture\_+foo\_show\_bar\_loadedBar/);
  });

  it('should fail with component with capture not in context', () => {
    const componentInput = `<event.show-event event=foo.show-bar.loadedBar />`;
    expect(() => componentInputCompiler.compile(componentInput, {}))
      .toThrow();
  });

  it('should compile component with the output of an component as the input of ' +
    'the innermost of two nested inputs', () => {
      const componentInput = `
        <authentication.logged-in />
        <event.choose-and-show-series
          showEvent=
              <morg.show-group-meeting
                groupMeeting=$event
                loggedInUserId=authentication.logged-in.user?.id />
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      `;

      const compiledComponentInput: CompiledComponentInput = componentInputCompiler
        .compile(componentInput, {});
      expect(compiledComponentInput.component)
        .toMatch(/authentication\.logged\-in\.user\?\.id/);
    });
});
