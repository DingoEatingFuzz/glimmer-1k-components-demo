import Component, { tracked } from '@glimmer/component';
import { interpolateViridis } from 'd3-scale';

enum Layout {
  PHYLLOTAXIS = 0,
  GRID,
  WAVE,
  SPIRAL
}

const LAYOUT_ORDER = [
  Layout.PHYLLOTAXIS,
  Layout.SPIRAL,
  Layout.PHYLLOTAXIS,
  Layout.GRID,
  Layout.WAVE,
];

export default class VizDemo extends Component {
  @tracked layout = 0;
  @tracked count = 100;
  @tracked phyllotaxis = genPhyllotaxis(100);
  @tracked grid = genGrid(100);
  @tracked wave = genWave(100);
  @tracked spiral = genSpiral(100);

  @tracked points = [];

  @tracked step = 0;
  @tracked numSteps = 60 * 2;

  next() {
    this.step = (this.step + 1) % this.numSteps;

    if (this.step === 0) {
      this.layout = (this.layout + 1) % LAYOUT_ORDER.length;
    }

    const pct = Math.min(1, this.step / (this.numSteps * 0.8));
    const currentLayout = LAYOUT_ORDER[this.layout];
    const nextLayout = LAYOUT_ORDER[(this.layout + 1) % LAYOUT_ORDER.length];
    this.points = this.points.map(point => {
      const newPoint = Object.assign({}, point);
      newPoint.x = lerp(newPoint, pct, xForLayout(currentLayout), xForLayout(nextLayout));
      newPoint.y = lerp(newPoint, pct, yForLayout(currentLayout), yForLayout(nextLayout));
      return newPoint;
    });

    requestAnimationFrame(() => { this.next() });
  }

  makePoints() {
    const newPoints = [];
    for (var i = 0; i < this.count; i++) {
      newPoints.push({
        x: 0,
        y: 0,
        color: interpolateViridis(i / this.count),
      });
    }
    this.points = newPoints;
    this.setAnchors();
  }

  setAnchors() {
    this.points.forEach((p, index) => {
      const [ gx, gy ] = project(this.grid(index));
      const [ wx, wy ] = project(this.wave(index));
      const [ sx, sy ] = project(this.spiral(index));
      const [ px, py ] = project(this.phyllotaxis(index));
      Object.assign(p, { gx, gy, wx, wy, sx, sy, px, py });
    });
  }

  didUpdate() {
    if (this.args.count !== this.count) {
      this.count = this.args.count;

      this.phyllotaxis = genPhyllotaxis(this.count);
      this.grid = genGrid(this.count);
      this.wave = genWave(this.count);
      this.spiral = genSpiral(this.count);

      this.makePoints();
    }
  }

  didInsertElement() {
    this.next();
  }
};

const theta = Math.PI * (3 - Math.sqrt(5));

function xForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return 'px';
    case Layout.GRID:
      return 'gx';
    case Layout.WAVE:
      return 'wx';
    case Layout.SPIRAL:
      return 'sx';
  }
}

function yForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return 'py';
    case Layout.GRID:
      return 'gy';
    case Layout.WAVE:
      return 'wy';
    case Layout.SPIRAL:
      return 'sy';
  }
}

function lerp(obj, percent, startProp, endProp) {
  const px = obj[startProp];
  return px + (obj[endProp] - px) * percent;
}

function genPhyllotaxis(n) {
  return i => {
    const r = Math.sqrt(i / n);
    const th = i * theta;
    return [
      r * Math.cos(th),
      r * Math.sin(th),
    ];
  };
}

function genGrid(n) {
  const rowLength = Math.round(Math.sqrt(n));
  return i => [
    -0.8 + 1.6 / rowLength * (i % rowLength),
    -0.8 + 1.6 / rowLength * Math.floor(i / rowLength),
  ];
}

function genWave(n) {
  const xScale = 2 / (n - 1);
  return i => {
    const x = -1 + i * xScale;
    return [
      x,
      Math.sin(x * Math.PI * 3) * 0.3,
    ];
  };
}

function genSpiral(n) {
  return i => {
    const t = Math.sqrt(i / (n - 1));
    return [
      t * Math.cos(t * Math.PI * 10),
      t * Math.sin(t * Math.PI * 10),
    ];
  };
}

function scale(magnitude, vector) {
  return vector.map(p => p * magnitude);
}

function translate(translation, vector) {
  return vector.map((p, i) => p + translation[i]);
}

function project(vector) {
  const wh = window.innerHeight / 2;
  const ww = window.innerWidth / 2;

  return translate([ ww, wh ], scale(Math.min(wh, ww), vector));
}