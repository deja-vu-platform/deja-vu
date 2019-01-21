interface Config {
  containerSelector: string;
}

interface QuillInstance {
  // add methods as needed
  getSelection: (focus?: boolean) => { index: number, length: number };
}

export class Output {
  container: Element;

  constructor(private quill: QuillInstance, options: Config) {
    this.container = document.querySelector(options.containerSelector);
    this.container.textContent = 'Action Output';

    this.container.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('got this far!');
    });
  }

}
