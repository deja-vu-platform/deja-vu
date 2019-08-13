import { AppPage } from './app.po';

describe('Schedule App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display concept name', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Schedule!');
  });
});
