const fs = require('fs');
const path = require('path');

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  top: number;
  left: number;
}


// special characters not allowed in inputs
const regex = /[^\w\s\-]/gi;

// TODO get path emitted by main
export const projectsSavePath = path.join(__dirname, 'projects');


// from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
export function allElementsFromPoint(x, y) {
  let element: HTMLElement;
  const elements: HTMLElement[] = [];
  const oldVisibility = [];
  while (true) {
    element = <HTMLElement> document.elementFromPoint(x, y);
    if (!element || element === document.documentElement) {
      break;
    }
    elements.push(element);
    oldVisibility.push(element.style.visibility);
    // Temporarily hide the element (without changing the layout)
    element.style.visibility = 'hidden';
  }
  for (let k = 0; k < elements.length; k++) {
    elements[k].style.visibility = oldVisibility[k];
  }
  elements.reverse();
  return elements;
}

function saveObjectToFile(dirname, filename, object) {
  // Asynch
  const pathName = path.join(dirname, filename);
  fs.writeFile(pathName, JSON.stringify(object), function (err) {
    if (err) {
      return console.log(err);
    }
    return true;
  });
}

export function saveProject(project) {
  saveObjectToFile(projectsSavePath, projectNameToFilename(project.meta.name), project);
}

export function filenameToProjectName(filename) {
  return filename.split('.').slice(0, -1).join('.');
}


export function projectNameToFilename(projectName) {
  return projectName + '.json';
}

export function generateId(): string {
  // use the full number!
  return Math.floor(Math.random() * 1000 * 1000 * 1000 * 1000 * 1000)
    .toString();
}


function checkStringForSpecialChars(string) {
  // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
  const matches = regex.test(string);
  // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
  regex.lastIndex = 0;
  return matches;
}

export function sanitizeStringOfSpecialChars(string) {
  // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
  // edited to include _ and -
  const outString = string.replace(regex, '');
  // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
  regex.lastIndex = 0;
  return outString;
}

function downloadObject(filename, obj) {
  const element = document.createElement('a');
  const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj));

  element.setAttribute('href', data);
  element.setAttribute('download', filename);

  element.click();
}

export function isCopyOfFile(dirname, filename) {
  const pathName = path.join(dirname, filename);
  try {
    const stats = fs.statSync(pathName);
    return true;
  } catch (err) {
    return false;
  }
}
