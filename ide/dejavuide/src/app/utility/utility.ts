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

// TODO get path emitted by main
export const projectsSavePath = path.join(__dirname, 'projects');

export function filenameToProjectName(filename) {
  return filename.split('.').slice(0, -1).join('.');
}

export function projectNameToFilename(projectName) {
  return projectName + '.json';
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

export function saveProject(project) {
  saveObjectToFile(projectsSavePath, projectNameToFilename(project.meta.name), project);
}

export function generateId(): string {
  // use the full number!
  return Math.floor(Math.random() * 1000 * 1000 * 1000 * 1000 * 1000)
    .toString();
}

function downloadObject(filename, obj) {
  const element = document.createElement('a');
  const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj));

  element.setAttribute('href', data);
  element.setAttribute('download', filename);

  element.click();
}

