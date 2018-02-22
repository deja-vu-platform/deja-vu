import { Widget } from './widget';

import { Dimensions } from '../../utility/utility';

export function getDefaultDimensions(widget: Widget): Dimensions {
  if (widget.isUserType()) {
    return  { width: 400, height: 400 };
  }
  if (widget.isBaseType()) {
    if (widget.isImage()) {
      return { width: 200, height: 200 };
    }
    if (widget.isLabel()) {
      return { width: 400, height: 200 };
    }
    if (widget.isLink()) {
      return { width: 200, height: 100 };
    }
    if (widget.isTab()) {
      return { width: 200, height: 400 };
    }
    if (widget.isPanel()) {
      return { width: 200, height: 100 };
    }
    if (widget.isMenu()) {
      return { width: 200, height: 200 };
    }
  }
}


export function getIconLocation(widget: Widget): string {
  if (widget.isUserType()) {
    return 'assets/user_icon.png';
  }
  if (widget.isBaseType()) {
    if (widget.isImage()) {
      return 'assets/image_icon.png';
    }
    if (widget.isLabel()) {
      return 'assets/label_icon.png';
    }
    if (widget.isLink()) {
      return 'assets/link_icon.png';
    }
    if (widget.isTab()) {
      return 'assets/tab_icon.png';
    }
    if (widget.isPanel()) {
      return 'assets/panel_icon.png';
    }
    if (widget.isMenu()) {
      return 'assets/menu_icon.png';
    }
  }
}
