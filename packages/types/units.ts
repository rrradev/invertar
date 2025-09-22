export enum Unit {
  PCS = 'PCS',     // pieces 
  KG = 'KG',       // kilograms
  G = 'G',         // grams
  L = 'L',         // liters
  ML = 'ML',       // milliliters
  M = 'M',         // meters
  CM = 'CM',       // centimeters
  M2 = 'M2',       // square meters
  M3 = 'M3',       // cubic meters
}

export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.PCS]: 'pieces',
  [Unit.KG]: 'kilograms',
  [Unit.G]: 'grams', 
  [Unit.L]: 'liters',
  [Unit.ML]: 'milliliters',
  [Unit.M]: 'meters',
  [Unit.CM]: 'centimeters',
  [Unit.M2]: 'square meters',
  [Unit.M3]: 'cubic meters',
};