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
    this.graphWidth = this.monthStartPosition + this.monthWidth * this.data.months - 50;
    this.yOffset = 70;

    const [y, m] = this.data.startMonth.split("-").map(x => parseInt(x));
    this.startYear = y;
    this.startMonth = m;
  }

  draw() {
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

    let solid = `M40,0 H${this.graphWidth} M40,50 H${this.graphWidth} M40,0 V${y} M90,0 V${y}`;
    let dotted = '';

    for (let month = 0; month <= this.data.months; month++) {
      solid += ` M${250 + this.monthWidth * month},0 V${y}`;
      dotted += ` M${300 + this.monthWidth * month},50 V${y}`;
    }

    const majorLines = newElement('path', gridlines);
    majorLines.classList.add('line');
    majorLines.setAttribute('d', solid);

    const halfMonthLines = newElement('path', gridlines);
    halfMonthLines.classList.add('dotted-line');
    halfMonthLines.setAttribute('d', dotted);
  }

  resizeViewport() {
    const svg = document.getElementById("svg");
    const width = this.monthStartPosition + this.monthWidth * this.data.months;
    const height = this.yOffset + 50;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
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
      path.setAttribute('d', `M${offset + 40},60 V${this.yOffset + 50}`);
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

    if (project.rag) {
      const rag = newElement('circle', g);
      rag.setAttribute('cx', 25);
      rag.setAttribute('cy', 25);
      rag.setAttribute('r', 10);
      rag.classList.add('rag');
      rag.classList.add(project.rag);
    }

    this.drawProjectOrEpicLine(project, g);
    this.yOffset += 45;

    if (project.epics && project.epics.length) {
      const separator = newElement('path', g);
      separator.setAttribute('d', `M0,50 H${this.graphWidth - 40}`);
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
    divider.setAttribute('d', `M40,${this.yOffset} H${this.graphWidth}`);
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

    if (data.description) {
      const description = newElement('text', g, data.description);
      description.setAttribute("x", 195);
      description.setAttribute("y", 40);
      description.classList.add('description');
    }

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
    let [year, month, day] = date.split("-").map(x => parseInt(x));

    let monthOffset = (year - this.startYear) * 12 + month - this.startMonth;
    if (monthOffset < 0) { return null; }

    if (monthOffset >= this.data.months) {
      if (isStopDate) {
        monthOffset = this.data.months;
        day = 1;
      } else {
        return null;
      }
    }

    return this.monthStartPosition - 90 + Math.floor(this.monthWidth * (monthOffset + ((day - 1) / (daysInMonth[month] - 1))));
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
