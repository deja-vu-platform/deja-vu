import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';
import { MatMenu } from '@angular/material';


const overlaySelector = '.cdk-overlay-backdrop'
  + '.cdk-overlay-transparent-backdrop'
  + '.cdk-overlay-backdrop-showing';

/**
 * The overlay appears 1msec after the animation
 * If for some reason this takes longer we'll try again
 */
function removeOverlay(delay = 1, nextDelay = 10) {
  setTimeout(() => {
    const overlay = document.querySelector(overlaySelector);
    if (overlay) {
      overlay.parentElement.removeChild(overlay);
    } else {
      removeOverlay(nextDelay);
    }
  }, delay);
}

/**
 * Allow an element to be dragged anywhere (uses absolute positioning)
 * Dragula does not support this
 * Directive-based solutions like angular2-draggable don't work
 *    since I can't put a directive on mat-menu
 * So this hack it is
 * @param {HTMLElement} element what moves
 * @param {HTMLElement} [handle] what you click and drag on
 *    (defaults to element)
 */
function makeDraggable(element: HTMLElement, handle?: HTMLElement) {
  handle = handle ? handle : element;

  let lastClientX: number;
  let lastClientY: number;
  let left: number;
  let top: number;

  function onMove(mouseEvent: MouseEvent) {
    left += mouseEvent.clientX - lastClientX;
    top += mouseEvent.clientY - lastClientY;

    element.style.position = 'absolute';
    element.style.left = left + 'px';
    element.style.top = top + 'px';

    lastClientX = mouseEvent.clientX;
    lastClientY = mouseEvent.clientY;
  }

  handle.addEventListener('mousedown', (mouseEvent: MouseEvent) => {
    lastClientX = mouseEvent.clientX;
    lastClientY = mouseEvent.clientY;
    const rect = element.getBoundingClientRect();
    left = rect.left;
    top = rect.top;
    window.addEventListener('mousemove', onMove);
  });

  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', onMove);
  });
}


@Component({
  selector: 'app-floating-menu',
  templateUrl: './floating-menu.component.html',
  styleUrls: ['./floating-menu.component.scss'],
  exportAs: 'matMenu'
})
export class FloatingMenuComponent implements AfterViewInit {
  private static ANIMS_PER_CYCLE = 4;
  private static OPEN_ANIM_NUM = 0;
  // private static CLOSE_ANIM_NUM = 3;

  @ViewChild('menu') matMenu: MatMenu;
  @ViewChild('content') content: ElementRef;

  @Output() closed = new EventEmitter<null>();
  @Output() shouldClose = new EventEmitter<null>();
  private animCount = 0;

  /**
   * There is no MatMenu open event so I'm hacking one
   */
  ngAfterViewInit() {
    const origOnAnimDone = this.matMenu._onAnimationDone.bind(this.matMenu);
    this.matMenu._onAnimationDone = (ev) => {
      origOnAnimDone(ev);
      if (this.animCount === FloatingMenuComponent.OPEN_ANIM_NUM) {
        this.onOpened();
      }
      this.animCount = (
        (this.animCount + 1) % FloatingMenuComponent.ANIMS_PER_CYCLE
      );
    };
  }

  /**
   * Should fire when the menu is actually opened
   */
  private onOpened() {
    const menu = this.content.nativeElement
      .parentElement
      .parentElement
      .parentElement;
    const handle = this.content.nativeElement.querySelector('.handle');
    makeDraggable(menu, handle);
    removeOverlay();
  }

  /**
   * Forward the event from MatMenu
   */
  onClosed() {
    this.closed.emit(null);
  }

  /**
   * Unfortunately MatMenu can only be closed from the trigger
   * So the component must tell its parent to close it
   */
  close() {
    this.shouldClose.emit(null);
  }
}
