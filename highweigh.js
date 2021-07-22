const months = [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = [null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function newElement(name, parent = null, text = null) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  if (parent) {
    parent.appendChild(element);
  }
  if (text) {
    element.appendChild(document.createTextNode(text));
  }
  return element;
}

class Roadmap {
  constructor(data) {
    this.data = data;
    this.monthStartPosition = 300;
    this.monthWidth = 100;
    this.yOffset = 70;

    const [y, m] = this.data.startMonth.split("-").map(x => parseInt(x));
    this.startYear = y;
    this.startMonth = m;
  }

  draw() {
    if (this.data.months !== 7) {
      alert("This only works with 7 months at the moment :(");
      return;
    }

    document.getElementsByTagName('title')[0].innerText = `${this.data.title} - Highweigh`;
    document.getElementById("title").innerText = this.data.title;
    document.getElementById("updated").innerText = `Last updated ${this.data.lastUpdated}`;

    this.drawMonths();

    for (const project of this.data.projects) {
      this.drawProject(project);
    }

    this.drawGridlines();
    this.resizeViewport();
    this.drawTodayLine();
    this.clearRemainingSpace();
  }

  drawGridlines() {
    const gridlines = document.getElementById('gridlines');

    const y = this.yOffset;

    const majorLines = newElement('path', gridlines);
    majorLines.classList.add('line');
    majorLines.setAttribute('d', `M40,0 H950 M40,50 H950 M40,0 V${y} M90,0 V${y} M250,0 V${y} M350,0 V${y} M450,0 V${y} M550,0 V${y} M650,0 V${y} M750,0 V${y} M850,0 V${y} M950,0 V${y}`);

    const halfMonthLines = newElement('path', gridlines);
    halfMonthLines.classList.add('dotted-line');
    halfMonthLines.setAttribute('d', `M300,50 V${y} M400,50 V${y} M500,50 V${y} M600,50 V${y} M700,50 V${y} M800,50 V${y} M900,50 V${y}`);
  }

  resizeViewport() {
    const svg = document.getElementById("svg");
    svg.setAttribute('viewBox', `0 0 1000 ${this.yOffset + 50}`);
  }

  clearRemainingSpace() {
    const svg = document.getElementById("svg");
    const rect = newElement('rect', svg);
    rect.setAttribute('x', 0);
    rect.setAttribute('y', this.yOffset + 0.5);
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
  }

  drawTodayLine() {
    const date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const offset = this.calculateOffset(today);

    if (offset !== null) {
      const svg = document.getElementById("svg");
      const path = newElement('path', svg);
      path.setAttribute('d', `M${offset + 40},60 V900`);
      path.classList.add('today-line');
    }
  }

  drawMonths() {
    const header = document.getElementById("header");

    for (let index = 0; index < this.data.months; index++) {
      const month = (this.startMonth - 1 + index) % 12 + 1;
      const x = this.monthStartPosition + index * this.monthWidth;

      const text = newElement('text', header, months[month]);
      text.classList.add('month');
      text.setAttribute('x', x);
    }
  }

  drawProject(project) {
    const svg = document.getElementById("svg");

    const g = newElement('g', svg);
    g.classList.add('project');
    g.setAttribute('transform', `translate(40 ${this.yOffset})`);

    const rag = newElement('circle', g);
    rag.setAttribute('cx', 25);
    rag.setAttribute('cy', 25);
    rag.setAttribute('r', 10);
    rag.classList.add('rag');
    rag.classList.add(project.rag);

    this.drawProjectOrEpicLine(project, g);
    this.yOffset += 45;

    if (project.epics && project.epics.length) {
      const separator = newElement('path', g);
      separator.setAttribute('d', "M0,50 H910");
      separator.classList.add('dotted-line');

      for (const epic of project.epics) {
        this.drawEpic(epic);
        this.yOffset += 20;
      }

      this.yOffset += 30;
    }
    else {
      this.yOffset += 5;
    }

    const divider = newElement('path', svg);
    divider.setAttribute('d', `M40,${this.yOffset} H950`);
    divider.classList.add('line');
  }

  drawEpic(epic) {
    const svg = document.getElementById("svg");

    const g = newElement('g', svg);
    g.classList.add('epic');
    g.setAttribute('transform', `translate(40 ${this.yOffset})`);

    this.drawProjectOrEpicLine(epic, g);
  }

  drawProjectOrEpicLine(data, g) {
    const title = newElement('text', g, data.name);
    title.setAttribute('x', 195);
    title.setAttribute('y', 25);

    if (data.bars) {
      this.drawBars(data.bars, g);
    }

    if (data.milestones) {
      this.drawMilestones(data.milestones, g);
    }
  }

  drawBars(bars, g) {
    for (const bar of bars) {
      const rect = newElement('rect', g);
      rect.classList.add('bar');
      rect.classList.add(bar.type);
      rect.setAttribute('height', 10);
      rect.setAttribute('rx', 2);
      rect.setAttribute('y', 20);

      const start = this.calculateOffset(bar.start);
      if (start !== null) {
        const stop = this.calculateOffset(bar.stop, true);
        rect.setAttribute('x', start);
        rect.setAttribute('width', stop - start);
      }
    }
  }

  drawMilestones(milestones, g) {
    for (const date of Object.keys(milestones)) {
      const type = milestones[date];
      const offset = this.calculateOffset(date);

      if (offset !== null) {
        const group = newElement('g', g);
        group.setAttribute('transform', `translate(${offset} 20) translate(-6 -1) rotate(45 6 6)`);

        const rect = newElement('rect', group);
        rect.setAttribute('width', 12);
        rect.setAttribute('height', 12);
        rect.classList.add('milestone');
        rect.classList.add(type);
      }
    }
  }

  calculateOffset(date, isStopDate) {
    const [year, month, day] = date.split("-").map(x => parseInt(x));

    let monthDifference = (year - this.startYear) * 12 + month - this.startMonth;
    if (monthDifference < 0) { return null; }

    if (monthDifference >= this.data.months) {
      if (isStopDate) {
        monthDifference = this.data.months;
      } else {
        return null;
      }
    }

    return this.monthStartPosition - 90 + Math.floor(this.monthWidth * (monthDifference + ((day - 1) / (daysInMonth[month] - 1))));
  }
}

window.addEventListener("load", async () => {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    new Roadmap(data).draw()
  }
  catch (e) {
    document.body.classList.add('error');
    document.body.innerText = `Error loading data: ${e}`;
  }
});
