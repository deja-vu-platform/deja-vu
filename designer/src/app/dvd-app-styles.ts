/* TODO: figure out how to import CSS as a string */

export default `
@import "~@angular/material/prebuilt-themes/indigo-pink.css";
@import "~bootstrap/dist/css/bootstrap.min.css";

.dvd-row {
  display: flex;
  flex-wrap: wrap;
}

.dvd-row.jfs {
  justify-content: flex-start;
}

.dvd-row.jfe {
  justify-content: flex-end;
}

.dvd-row.jc {
  justify-content: center;
}

.dvd-row.jsb {
  justify-content: space-between;
}

.dvd-row.jsa {
  justify-content: space-around;
}

.dvd-row.jse {
  justify-content: space-evenly;
}

.dvd-row.afs {
  align-items: flex-start;
}

.dvd-row.afe {
  align-items: flex-end;
}

.dvd-row.ac {
  align-items: center;
}

.dvd-row.ab {
  align-items: baseline;
}

.dvd-row.as {
  align-items: stretch;
}

.dvd-row > * {
  flex-grow: 0;
  flex-shrink: 1;
  width: max-content;
}

.dvd-row > .stretch {
  flex-grow: 1;
}

body > * > * > .dvd-action {
  min-height: 100vh;
}
`;
