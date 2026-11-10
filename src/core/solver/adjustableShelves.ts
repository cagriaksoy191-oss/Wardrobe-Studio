import { DistributionError } from './flexSolver';
import { validationConfig } from './validationConfig';

export function shelfGridIntervals(heightMm: number, thicknessMm: number, rows: number[]): number[] {
  const gaps: number[] = [];
  let upperFace = 0;
  for (const row of rows) {
    const lowerFace = row * validationConfig.adjustableShelfPitchMm;
    gaps.push(lowerFace - upperFace);
    upperFace = lowerFace + thicknessMm;
  }
  gaps.push(heightMm - upperFace);
  if (gaps.some(gap => gap < validationConfig.adjustableShelfMinimumGapMm)) {
    throw new DistributionError(
      `32 mm raf düzeninde komşu yüzeyler arasında en az ${validationConfig.adjustableShelfMinimumGapMm} mm net aralık gerekir.`
    );
  }
  return gaps;
}
