/** Plain-English labels for enum values shown in the UI. */
export const RETURN_REASON: Record<string, string> = {
  TOO_SMALL: 'Too small',
  TOO_LARGE: 'Too large',
  POOR_FIT: 'Poor fit',
  POOR_QUALITY: 'Poor quality',
  NOT_AS_DESCRIBED: 'Not as described',
  COLOR_MISMATCH: 'Colour not as pictured',
  STYLE_DISLIKE: 'Didn’t like the style',
  DAMAGE_DEFECT: 'Damaged or defective',
  WRONG_ITEM: 'Wrong item sent',
  CHANGED_MIND: 'Changed mind',
  OTHER: 'Other',
}

export const CATEGORY: Record<string, string> = {
  TOPS: 'Tops',
  BOTTOMS: 'Bottoms',
  DRESSES: 'Dresses',
  OUTERWEAR: 'Outerwear',
  ACTIVEWEAR: 'Activewear',
  UNDERWEAR: 'Underwear',
  SHOES: 'Shoes',
  ACCESSORIES: 'Accessories',
}

export const GENDER: Record<string, string> = {
  WOMENS: 'Women',
  MENS: 'Men',
  UNISEX: 'Unisex',
  KIDS_BOYS: 'Boys',
  KIDS_GIRLS: 'Girls',
}

/** Return reasons a better product page or size chart could have prevented. */
export const PREVENTABLE_RETURNS = new Set(['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT', 'POOR_QUALITY', 'NOT_AS_DESCRIBED', 'COLOR_MISMATCH', 'DAMAGE_DEFECT'])
