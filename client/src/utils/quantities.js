export const measurementUnits = [
  { value: '', label: 'No unit' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'l', label: 'Litres (l)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'cup', label: 'Cups' },
  { value: 'pinch', label: 'Pinches' },
  { value: 'whole', label: 'Whole items' },
  { value: 'clove', label: 'Cloves' },
  { value: 'bulb', label: 'Bulbs' },
  { value: 'bunch', label: 'Bunches' },
  { value: 'can', label: 'Cans' },
  { value: 'jar', label: 'Jars' },
  { value: 'bottle', label: 'Bottles' },
  { value: 'packet', label: 'Packets' },
  { value: 'bag', label: 'Bags' },
  { value: 'box', label: 'Boxes' },
  { value: 'slice', label: 'Slices' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
]

export function formatQuantity(quantity, unit = '') {
  return [quantity.trim(), unit].filter(Boolean).join(' ')
}

export function splitQuantity(value = '') {
  // Preserve existing free-text quantities and saved units when editing.
  const match = value.trim().match(/^(\d.*?)\s+([a-zA-Z]+)$/)
  return match
    ? { quantity: match[1], unit: match[2] }
    : { quantity: value, unit: '' }
}
