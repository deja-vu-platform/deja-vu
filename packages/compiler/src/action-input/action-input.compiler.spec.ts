import { ActionSymbolTable } from '../symbolTable';
import {
  ActionInputCompiler, CompiledActionInput
} from './action-input.compiler';


describe('ActionInputCompiler', () => {
  let actionInputCompiler: ActionInputCompiler;

  beforeEach(() => {
    actionInputCompiler = new ActionInputCompiler();
  });

  it('should compile action input with HTML only', () => {
    const actionInput = `<h1>Hello</h1>`;
    const compiledActionInput: CompiledActionInput = actionInputCompiler
      .compile(actionInput, {});
    expect(compiledActionInput.action)
      .toMatch('Hello');
    expect(compiledActionInput.action)
      .toMatch('dv.action');
  });

  it('should compile wrapped action input with HTML only', () => {
    const actionInput = `<dv.action><h1>Hello</h1></dv.action>`;
    const compiledActionInput: CompiledActionInput = actionInputCompiler
      .compile(actionInput, {});
    expect(compiledActionInput.action)
      .toMatch('Hello');
    expect(compiledActionInput.action)
      .toMatch('dv.action');
  });

  it('should compile action with capture', () => {
    const actionInput = `<event.show-event event=foo.show-bar.loadedBar />`;
    const context: ActionSymbolTable = {
      foo: {
        kind: 'cliche',
        symbolTable: {
          'show-bar': {
            kind: 'action'
          }
        }
      }
    };
    const compiledActionInput: CompiledActionInput = actionInputCompiler
      .compile(actionInput, context);
    expect(compiledActionInput.action)
      .toMatch('event.show-event');
    expect(compiledActionInput.action)
      .toMatch('dv.action');
    expect(compiledActionInput.action)
      .toMatch(/event=\$capture\_+foo\_show\_bar\_loadedBar/);
  });

  it('should fail with action with capture not in context', () => {
    const actionInput = `<event.show-event event=foo.show-bar.loadedBar />`;
    expect(() => actionInputCompiler.compile(actionInput, {}))
      .toThrow();
  });

  it('should compile action with the output of an action as the input of ' +
    'the innermost of two nested inputs', () => {
      const actionInput = `
        <authentication.logged-in />
        <event.choose-and-show-series
          showEvent=
              <morg.show-group-meeting
                groupMeeting=$event
                loggedInUserId=authentication.logged-in.user?.id />
          noEventsToShowText="No meetings to show"
          chooseSeriesSelectPlaceholder="Choose Meeting Series" />
      `;

      const compiledActionInput: CompiledActionInput = actionInputCompiler
        .compile(actionInput, {});
      expect(compiledActionInput.action)
        .toMatch(/authentication\.logged\-in\.user\?\.id/);
    });
});
