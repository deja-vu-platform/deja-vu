import 'jasmine';
import { ActionCompiler } from './actionCompiler';

const HTML_ACTION = `
  <div class="col-md-2 main">
    <!-- Hello -->
    <h1>Hello</h1>
    <br/>
    <!--
      multi-line
      comment
    -->
    <p class="para">
      Lorem ipsum
    </p>
    <input type="button" class="button">Click</button>
  </div>
`;

describe('ActionCompiler', () => {
  let actionCompiler: ActionCompiler;

  beforeEach(() => {
    actionCompiler = new ActionCompiler();
  });
  it('should parse action with HTML only', () => {
    console.log('I am in a test');
    actionCompiler.compile(HTML_ACTION, {});
  });
});
