export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const USERNAME_REGEX
  = new RegExp('^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+$');
export const USERNAME_PATTERN_MSG = 'alphanumeric and special characters ._-';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;
export const PASSWORD_REGEX = new RegExp([
  '^.*(?=.*[a-zA-Z])(?=.*[0-9])',
  '(?=.*[!@#$%^&*])(?!.*[`~()\\-_=+[{\\]}\\\|;:\\\'",.<>/? ]).*$'
].join(''));
export const PASSWORD_PATTERN_MSG = 'at least 1 lowercase letter, 1 uppercase '
  + 'letter, 1 special character (!@#$%^*&) and 1 number (0-9)';
