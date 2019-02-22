import { AppPage } from './app.po';

describe('<%= capitalize(clicheName) %> App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display cliché name', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('<%= capitalize(clicheName) %>!');
  });
});
