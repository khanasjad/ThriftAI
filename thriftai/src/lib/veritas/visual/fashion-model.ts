/**
 * Open-source fashion image model (B18): Marqo-FashionSigLIP (Apache-2.0), run on our own server through
 * Transformers.js. Turns a product photo, or a shopper's words, into a 768-number "looks like" fingerprint.
 * $0 per call (no API), ~60 ms per image on a laptop CPU. Not an LLM: it never writes text or scores.
 * The model files (~200 MB, 8-bit) download once into the cache and load lazily on first use.
 */
import { env } from '../env'

/** Bumped when the model or its settings change: stored fingerprints from another version are ignored. */
export const visualModelVersion = () => `${env().VISUAL_MODEL}@q8`

type Lib = typeof import('@huggingface/transformers')
type TextSide = { tokenizer: Awaited<ReturnType<Lib['AutoTokenizer']['from_pretrained']>>; model: Awaited<ReturnType<Lib['SiglipTextModel']['from_pretrained']>> }
type ImageSide = { processor: Awaited<ReturnType<Lib['AutoProcessor']['from_pretrained']>>; model: Awaited<ReturnType<Lib['SiglipVisionModel']['from_pretrained']>>; RawImage: Lib['RawImage'] }

let libP: Promise<Lib> | null = null
let textP: Promise<TextSide> | null = null
let imageP: Promise<ImageSide> | null = null

function lib(): Promise<Lib> {
  libP ??= import('@huggingface/transformers').then((t) => {
    // Serverless functions can only write to /tmp; locally the library's default cache is used.
    if (process.env.VERCEL) t.env.cacheDir = '/tmp/hf-models'
    return t
  })
  return libP
}

function textSide(): Promise<TextSide> {
  textP ??= lib()
    .then(async (t) => ({ tokenizer: await t.AutoTokenizer.from_pretrained(env().VISUAL_MODEL), model: await t.SiglipTextModel.from_pretrained(env().VISUAL_MODEL, { dtype: 'q8' }) }))
    .catch((e) => {
      textP = null
      console.error('[visual] text model failed to load:', e instanceof Error ? e.message : e)
      throw e
    })
  return textP
}

/** Starts loading the text model (no-op if loading or loaded). Resolves when it's ready. */
export function warmTextModel(): Promise<unknown> {
  return textSide().then(() => {
    textReady = true
  })
}

export const textModelReady = () => textReady

/** The text model's load, while it is still loading (null once ready or never started). */
export function textModelLoading(): Promise<unknown> | null {
  return textReady ? null : textP
}
let textReady = false

function imageSide(): Promise<ImageSide> {
  imageP ??= lib()
    .then(async (t) => ({ processor: await t.AutoProcessor.from_pretrained(env().VISUAL_MODEL), model: await t.SiglipVisionModel.from_pretrained(env().VISUAL_MODEL, { dtype: 'q8' }), RawImage: t.RawImage }))
    .catch((e) => {
      imageP = null
      throw e
    })
  return imageP
}

/** Fingerprint of a product photo (unit length). */
export async function imageEmbedding(bytes: Buffer): Promise<number[]> {
  const { processor, model, RawImage } = await imageSide()
  const image = await RawImage.fromBlob(new Blob([new Uint8Array(bytes)]))
  const { image_embeds } = await model(await processor(image))
  return image_embeds.normalize().tolist()[0] as number[]
}

const textCache = new Map<string, number[]>()

/**
 * Fingerprint of a short phrase (unit length). Waits at most `waitMs` (search must stay fast): on a cold start
 * the model keeps loading in the background and this returns null, so search falls back to photo labels only.
 */
export async function textEmbedding(phrase: string, { waitMs = 2500 }: { waitMs?: number } = {}): Promise<number[] | null> {
  const key = phrase.toLowerCase().trim()
  const hit = textCache.get(key)
  if (hit) return hit
  const work = textSide().then(async ({ tokenizer, model }) => {
    textReady = true
    const { text_embeds } = await model(tokenizer([key], { padding: 'max_length', truncation: true }))
    const v = text_embeds.normalize().tolist()[0] as number[]
    if (textCache.size > 500) textCache.delete(textCache.keys().next().value!)
    textCache.set(key, v)
    return v
  })
  work.catch(() => {})
  return Promise.race([work, new Promise<null>((r) => setTimeout(() => r(null), waitMs))]).catch(() => null)
}
