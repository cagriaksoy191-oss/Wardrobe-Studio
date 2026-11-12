type ScreenAnchor = { x: number; y: number; z: number };

/** Leave room for the full scene button and its focus ring. */
export function runEndControlsFit(anchors: readonly ScreenAnchor[], width: number, height: number, toolbarBottom: number) {
  const clearance = 22;
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    if (!(anchor.z >= -1 && anchor.z <= 1 && anchor.x >= clearance && anchor.x <= width - clearance &&
      anchor.y >= toolbarBottom + clearance && anchor.y <= height - clearance)) return false;
    for (let j = 0; j < i; j++) {
      const other = anchors[j];
      if (Math.abs(anchor.x - other.x) < clearance * 2 && Math.abs(anchor.y - other.y) < clearance * 2) return false;
    }
  }
  return true;
}
