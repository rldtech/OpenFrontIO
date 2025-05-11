export class BezenhamLine {
  constructor(
    private x0: number,
    private y0: number,
    private x1: number,
    private y1: number,
  ) {
    this.dx = Math.abs(this.x1 - this.x0);
    this.dy = Math.abs(this.y1 - this.y0);
    this.sx = this.x0 < this.x1 ? 1 : -1;
    this.sy = this.y0 < this.y1 ? 1 : -1;
    this.error = this.dx - this.dy;
  }

  private dx: number;
  private dy: number;
  private sx: number;
  private sy: number;
  private error: number;

  size() {
    return Math.max(this.dx, this.dy) + 1;
  }

  // Increment either by 1 in x or y
  increment(): { x: number; y: number } | true {
    if (this.x0 === this.x1 && this.y0 === this.y1) {
      return true;
    }
    const x = this.x0;
    const y = this.y0;
    const err2 = 2 * this.error;

    if (err2 > -this.dy) {
      this.error -= this.dy;
      this.x0 += this.sx;
    }
    if (err2 < this.dx) {
      this.error += this.dx;
      this.y0 += this.sy;
    }
    return { x, y };
  }
}

export class BezierCurve {
  constructor(
    private x0: number,
    private y0: number,
    private x1: number,
    private y1: number,
  ) {
    this.controlPoint0X = x0;
    this.controlPoint0Y = y0;
    this.controlPoint1X = x1;
    this.controlPoint1Y = y1;
    const dx = this.x1 - this.x0;
    const dy = this.y1 - this.y0;
    const dist = Math.abs(this.x1 - this.x0);
  }

  private t: number = 0;
  private controlPoint0X: number;
  private controlPoint0Y: number;
  private controlPoint1X: number;
  private controlPoint1Y: number;

  setControlPoint0(x, y) {
    this.controlPoint0X = x;
    this.controlPoint0Y = y;
  }

  setControlPoint1(x, y) {
    this.controlPoint1X = x;
    this.controlPoint1Y = y;
  }

  increment(incr: number): { x: number; y: number } {
    // Calculate the next point on the Bézier curve
    // const incr = speed / (this.distance * 2);
    this.t = this.t + incr;
    if (this.t >= 1) {
      return null; // end reached
    }
    const nextX =
      Math.pow(1 - this.t, 3) * this.x0 +
      3 * Math.pow(1 - this.t, 2) * this.t * this.controlPoint0X +
      3 * (1 - this.t) * Math.pow(this.t, 2) * this.controlPoint1X +
      Math.pow(this.t, 3) * this.x1;
    const nextY =
      Math.pow(1 - this.t, 3) * this.y0 +
      3 * Math.pow(1 - this.t, 2) * this.t * this.controlPoint0Y +
      3 * (1 - this.t) * Math.pow(this.t, 2) * this.controlPoint1Y +
      Math.pow(this.t, 3) * this.y1;
    return { x: nextX, y: nextY };
  }
}
