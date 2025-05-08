const homepageViewersByWorker: Map<number, number> = new Map();

export function setHomepageViewers(workerId: number, count: number) {
  homepageViewersByWorker.set(workerId, count);
}

export function getTotalHomepageViewers(): number {
  let total = 0;
  for (const count of homepageViewersByWorker.values()) {
    total += count;
  }
  return total;
}
