interface Config {
  containerSelector: string;
}

interface QuillInstance {
  // add methods as needed
  getSelection: (focus?: boolean) => { index: number, length: number };
}

export class Output {
  container: HTMLElement;

  constructor(private quill: QuillInstance, options: Config) {
    this.container = <HTMLElement>document
      .querySelector(options.containerSelector);
    this.container.innerHTML =
      '<span class="text-button-text">Component Output</span>';

    this.container.addEventListener('click', (e) => {
      e.preventDefault();
    });
  }

}
