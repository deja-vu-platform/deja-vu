import {
  AfterViewInit,
  Component,
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

@Component({
  selector: 'app-floating-menu',
  templateUrl: './floating-menu.component.html',
  styleUrls: ['./floating-menu.component.scss'],
  exportAs: 'matMenu'
})
export class FloatingMenuComponent implements AfterViewInit {
  @ViewChild('menu') matMenu: MatMenu;
  @Output() closed = new EventEmitter<null>();
  @Output() shouldClose = new EventEmitter<null>();
  private opened: boolean;

  /**
   * Remove the overlay that closes the menu when you click away
   * There is no open event which is why I'm hacking an on First Animation
   */
  ngAfterViewInit() {
    const origOnAnimDone = this.matMenu._onAnimationDone.bind(this.matMenu);
    this.matMenu._onAnimationDone = (ev) => {
      if (!this.opened) { removeOverlay(); }
      this.opened = true;
      origOnAnimDone(ev);
    };
  }

  onClosed() {
    this.opened = false;
    this.closed.emit(null);
  }

  /**
   * Unfortunately MatMenu can only be closed from the trigger
   */
  close() {
    this.shouldClose.emit(null);
  }
}
