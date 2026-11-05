/** Shared helpers for the second-hand garment dataset (RISE / Wargön Innovation, Zenodo 8386668, CC BY 4.0). */
import { join } from 'node:path'
import sharp from 'sharp'

export const ARCHIVE = join(process.cwd(), '.veritas/real-data/circular/circular_fashion_v1.tar.gz')
export const WORK = join(process.cwd(), '.veritas/real-data/circular/extract')

/**
 * The sorting-table camera shoots garments lying sideways (collar or waistband to the right), with the table
 * edge, cables and a bracket in frame. Crop to the work area, turn upright, resize, drop metadata.
 */
export async function framed(src: string, dest: string, size = 640) {
  const img = sharp(src).rotate()
  const { width = 0, height = 0 } = await img.metadata()
  const left = Math.round(width * 0.14)
  const area = { left, top: 0, width: Math.round(width * 0.92) - left, height: Math.round(height * 0.84) }
  const cropped = await img.extract(area).toBuffer()
  await sharp(cropped).rotate(270).resize({ width: size, height: size, fit: 'inside' }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest)
}
