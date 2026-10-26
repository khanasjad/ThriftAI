# Veritas — The Clothing Score: Product & Company Plan

> **Source of truth.** Every plan, PR and prompt in this repo must agree with this document.
> If code or another doc disagrees, this file wins. Change it only on purpose, with a dated note under "Change log".
>
> Author: Asjad · Version 1 · Oct 23, 2026

## Summary

Veritas gives every clothing item one trustworthy score that answers the shopper's real question — *"is this worth buying, for me?"* — by combining everything people weigh before they buy: fit, quality, comfort, style, price, brand, trend, newness and ethics.

**The Veritas Clothing Score** has five pillars and 27 factors:

| Pillar | Weight |
| --- | --- |
| Fit & Sizing | 35% |
| Quality & Durability | 30% |
| Style & Value (incl. price, brand, trend) | 20% |
| Comfort | 15% |
| Sustainability | optional +5% |

**Two layers:** a **Product Score** that is the same for everyone, and a **Personal Match** that adjusts for the shopper's size, body, occasion, climate, budget and taste. Ranking uses both.

**Who it serves:**

- **Shoppers** — a conversational search that asks one smart question when needed, then shows the best 3 picks with reasons.
- **Brands** — a score and insights dashboard ($299–$2K/month) that shows why products sell, get returned, or get kept.
- **Search and AI platforms** — an API so site search and AI shopping agents can rank by the Veritas Score. We complement them, not compete.

**Pitch:** *"Sales data shows you what sells. Veritas shows you what's worth buying."*

**Naming rule:** product pages, marketing copy, prompts and demo data never name other companies (search vendors, retailers, marketplaces, fit or review providers). Describe the category instead ("your site search", "a marketplace"). The competition section below is internal analysis only.

## How people decide to buy clothing

A clothing purchase is a dozen quiet questions at once. Today shoppers answer them by opening ten tabs, reading reviews, checking prices and guessing. Veritas answers all of them in one place.

| The shopper's question | Pillar it feeds |
| --- | --- |
| Will it fit me? Should I size up or down? Does it suit my body shape? | Fit & Sizing |
| Will it last? Will it shrink, fade or pill? Is the fabric good? | Quality & Durability |
| Will it feel good? Is it itchy, hot, stiff? Easy to wash? | Comfort |
| Is this a fair price? Is the "sale" real? Will it be cheaper next week? | Style & Value — price |
| Is this brand any good? Do people trust it? | Style & Value — brand |
| Is it in style? Will it still look good next year? Does it go with what I own? | Style & Value — style and trend |
| Does it look like the photos? | Style & Value — photo accuracy |
| It's brand new with no reviews — is it safe to try? | New-launch handling |
| Is it made responsibly? | Sustainability (optional) |
| Is it right for *my* event, weather and budget? | Personal Match |

Apparel has some of the highest return rates online (industry reports put it at roughly 1 in 5 fashion purchases, 25–40% for apparel and footwear; internal note, not for public copy). Most of those returns are one of these questions answered wrong.

## The Veritas Clothing Score

A 0–100 score built from 27 factors in five pillars. Starting weights are below; they get tuned per category (a winter coat weighs warmth more than a tee does) and against real keep-and-return outcomes.

### Fit & Sizing — 35%

| Factor | Weight | How it's measured |
| --- | --- | --- |
| True-to-size rate | 8 | Reviews and returns saying "runs small / large" vs. "true to size" |
| Size consistency | 8 | Same size fits the same across the brand's products and batches |
| Fit by body shape | 6 | Fit comments segmented by height, build and shape where shoppers share them |
| Fit-related return rate | 6 | Share of returns with size or fit reasons |
| Length and proportions | 4 | Sleeve, inseam, torso length comments vs. size chart |
| Size range and inclusivity | 3 | Sizes offered, petite, tall and plus availability |

### Quality & Durability — 30%

| Factor | Weight | How it's measured |
| --- | --- | --- |
| Fabric quality | 6 | Composition, weight (GSM), weave or knit; owner comments on fabric |
| Construction | 6 | Seams, stitching, hems, zips and buttons — failure mentions |
| Wash durability | 6 | Shrinking, fading, bleeding, losing shape after washing |
| Wear resistance | 4 | Pilling, thinning, holes |
| Longevity | 5 | How long after purchase problems appear; long-term reviews |
| Quality-related return rate | 3 | Returns citing defects or poor quality |

### Style & Value — 20%

| Factor | Weight | How it's measured |
| --- | --- | --- |
| Value for money | 5 | Price vs. the quality and fit of similar items in its category |
| Price fairness | 3 | Price history across sellers; fake or inflated "discounts" flagged |
| Brand reputation | 3 | Brand-level ratings, return rates, consistency, customer service record |
| Looks as pictured | 3 | "Colour / fabric not as shown" complaints |
| Trend relevance | 3 | Search and social interest in the style, colour and silhouette |
| Versatility and timelessness | 2 | Styling comments ("goes with everything"), classic vs. fad styles |
| Resale value | 1 | Resale prices and demand on secondhand marketplaces |

### Comfort — 15%

| Factor | Weight | How it's measured |
| --- | --- | --- |
| Softness and feel | 4 | Fabric type and owner comments on feel |
| Breathability and temperature | 4 | Fibre and weight; "too hot", "warm", "breathable" comments |
| Stretch and mobility | 3 | Elastane content; "restrictive" vs. "easy to move in" |
| Skin friendliness | 2 | Itch, scratchy seams, tags, irritation mentions |
| Easy care | 2 | Care label (machine wash, no-iron) and owner experience |

### Sustainability — optional, +5%

| Factor | Weight | How it's measured |
| --- | --- | --- |
| Material certifications | 2 | Recognised certifications such as OEKO-TEX, GOTS, recycled-content labels |
| Ethical production | 2 | Published supplier lists, audits, third-party ratings |
| Repair and take-back | 1 | Repair programmes, warranties, take-back schemes |

Shoppers can switch sustainability on or off; when on, the other pillars scale down proportionally.

**Rules that make the score trustworthy:**

- **Confidence on every score** — High, Medium, Low or "New launch", based on how much evidence exists.
- **Shrink toward the category average** when evidence is thin, so 6 glowing reviews can't beat 6,000 solid ones.
- **Every factor links to its evidence** — click any number to see the reviews, prices or data behind it.
- **No pay-for-score.** Brands can submit data and fix their pages; they can't buy a higher number.

## Personal Match

The Product Score says how good an item is in general. The Personal Match (0–100) says how good it is for this shopper, right now. Ranking blends the two, so a great jacket that's wrong for you never takes the top spot.

| Match signal | What it adjusts | Example |
| --- | --- | --- |
| Size and body profile | Fit factors use comments from people with a similar build | "5'4", curvy — owners like you size up" |
| Occasion | Boosts style and formality that suit the event | Interview, wedding guest, office, gym, travel |
| Climate and season | Boosts breathability or warmth | Chicago in January vs. Miami in July |
| Budget | Hard limit plus a value preference | "Under $80, best value" |
| Style preference | Fits the shopper's taste and wardrobe | Minimal, streetwear, classic, bold colours |
| Priorities | Lets the shopper reweight pillars | "I care most about comfort" or "must last years" |
| Brand preferences | Includes or avoids chosen brands | "No fast fashion" |

**Ranking formula (starting point):** `final = 0.6 × Product Score + 0.4 × Personal Match`, then a diversity rule so the top 3 aren't near-duplicates. Weights get tuned on what shoppers actually click, buy and keep.

**Privacy:** the profile is optional, built from what the shopper tells us, editable, and deletable in one click.

## Special cases

**New launches (no reviews yet).** The score is built from what is known before anyone has worn it, and labelled "New launch — early score":

- The brand's track record on fit and quality for similar items
- Fabric composition, weight and construction details from the spec
- Price vs. similar items
- Early signals: pre-orders, wishlists, search interest, first returns

As reviews arrive, the early score blends into the evidence-based one. Brands get a "launch watch" alert if early signals turn negative.

**Trends.** Recomputed weekly, capped at 3 points of the score, and shown as a separate tag ("Trending", "Classic", "Fading"). A trendy item that falls apart still scores low.

**Brand value.** Earned from evidence across the brand's products — consistency, return rates, honesty of photos and prices — not from brand fame or ad spend. A famous label with inconsistent sizing loses points.

**Price changes.** Value and price fairness update with price history across sellers. A fake markdown is flagged; if it usually drops in sales periods, the shopper sees "Often cheaper — consider waiting".

## Shopper experience

One search box that understands needs, asks only when it matters, and ends with the best answer — not 300 results.

1. The shopper types naturally: *"blazer for a job interview, under $150"*.
2. Like a good shopkeeper, Veritas asks what it needs to know (who it's for, what it's for, budget, colour, fit, cut, length), **one question at a time, up to four per search**, skipping anything the shopper already said. Each question has tap-to-answer chips taken from what's actually in stock, plus free text. A **"Just show me"** option is always there, and provisional picks update after every answer. Afterwards the shopper can keep refining in plain words ("cheaper", "not black", "show jeans instead").
3. It returns **3 picks**: Best overall, Best value, and a Wildcard (most on-trend, most sustainable, or a new launch worth trying).
4. Each pick shows the Clothing Score, the Personal Match, the pillar breakdown, size advice, the main downside, and live prices from several sellers.

**Example result card:**

> **Best overall — Wool-blend single-breasted blazer** · Score 86 (High confidence) · Match 91 · Fit 90 · Quality 84 · Style & Value 82 · Comfort 80
> *Size advice:* owners with your build say true to size; sleeves run slightly long. *Downside:* needs dry cleaning. *Price:* $139 — fair; this item has not been cheaper in the last 90 days.

**Design principles:** score and evidence first, price second, brand last; no sponsored items in the top 3; every claim clickable to its source; "not enough evidence" shown honestly instead of a guess.

## Brand product and pricing

Brands get their own products scored on the same 27 factors, plus the reasons behind each number.

**What a brand sees:**

- Clothing Score and pillar breakdown for every product, compared with category peers
- Top problems ranked by cost: "runs small", "fades after washing", "photo colour inaccurate"
- Size-chart correction suggestions from fit evidence
- Price-position insight: where each product sits on value vs. competitors
- New-launch watch: early warning when a launch's signals turn negative
- Trend fit for upcoming collections
- An API to feed the score into their own site search and product pages

**Pricing (to validate with pilots):**

| Plan | For | Includes | Price |
| --- | --- | --- | --- |
| Starter | Small DTC brands | Scores and insights for up to 500 products, monthly refresh | $299/month |
| Growth | Growing brands | Up to 2,500 products, weekly refresh, Score API, launch watch | $799/month |
| Pro | Mid-market | Unlimited products, daily refresh, search integration, trend insights | $2,000/month |
| Platform | Marketplaces, search vendors, AI agents | Score feed and API at scale | Annual contract, priced by catalog size ("contact us" until pilots show the value) |

Pilot offer: a free one-time scorecard of a brand's catalog using their own reviews and return reasons.

## Agents and data sources

Six agents, each owning a slice of the 27 factors. Heavy reading happens offline; the live search only reads stored scores, so it stays fast and cheap.

| Agent | Owns | Runs | Build order |
| --- | --- | --- | --- |
| Evidence agent | Reads reviews, return reasons and Q&A; tags fit, quality, comfort, photo-accuracy and care evidence with quotes | Offline, nightly | 1 |
| Scoring engine | Combines all factors into pillar scores, applies weights, shrinkage and confidence (mostly code) | Offline, after agents | 1 |
| Price & Value agent | Price history across sellers, fake-discount detection, value vs. peers | Offline, daily | 2 |
| Trend & Brand agent | Trend signals, brand reputation roll-ups, new-launch early scores | Offline, weekly | 3 |
| Conversation agent | Understands the request, asks the one clarifying question, explains picks | Online, per search | 2 |
| Verifier | Checks every sentence shown to a shopper against stored evidence | Online, per answer | 2 |

| Data | Source | Used for |
| --- | --- | --- |
| Reviews and return reasons | Brands directly (B2B), review-app APIs, licensed review data | Fit, quality, comfort, photo accuracy |
| Product specs | Brand feeds, product pages via affiliate and merchant APIs | Fabric, construction, care, size range |
| Prices | Retailer and affiliate APIs, merchant feeds | Value, price fairness |
| Trends | Search-interest data, licensed social data, our own search logs | Trend relevance |
| Resale | Secondhand marketplace data where licensed | Resale value |
| Certifications | Certification bodies' public registries | Sustainability |

**Rule:** only sources whose terms allow this use; no scraping of sites that forbid it. Brand-provided data stays private to that brand.

## Competition and positioning

> Internal analysis. Never quote these names in product or marketing copy (see the naming rule in the Summary).

| Player | What they cover | Gap Veritas fills |
| --- | --- | --- |
| Constructor, Algolia | Search ranking by behaviour and conversion | No view of quality, comfort or value. We feed them a "worth buying" signal. |
| True Fit | Fit and size recommendations from ~20 years of data, plus an AI shopping agent | Fit only. We cover the other four pillars and can take fit signals from partners. |
| Review apps | Collecting and summarising reviews | No scoring across factors, no price, trend or brand view |
| Price trackers | Price history and alerts | No quality, fit or style view |
| Fashion editors and influencers | Style and trend judgement | Manual, subjective, often sponsored |
| ChatGPT, Gemini shopping | Conversational shopping at huge scale | No neutral, evidence-backed clothing score to cite — we supply it via API and MCP |

**Positioning line:** *the complete, explainable "worth buying" score for clothing.*
**Honesty:** on fit alone, True Fit's dataset is far deeper. Start the Fit pillar from brand reviews and returns; stay open to partnering on fit data.

## Roadmap

Start with two categories where all 27 factors matter and data is plentiful — **t-shirts and jeans** — then widen. Five phases, four gates, Nov 2026 – Dec 2027, assuming ~15–20 hours a week.

The full 27-factor model is designed from day one; factors switch on as their data source comes online, and each score shows which factors it currently includes.

## Risks

| Risk | Mitigation |
| --- | --- |
| 27 factors take long to build | Design all 27 now; launch with the factors that have data, label the rest "coming soon" per score |
| Data access for shopper-side scores | Brand data via B2B, licensed and affiliate feeds; no scraping where forbidden |
| Weights feel arbitrary | Start with stated weights, then tune against keep vs. return; publish the method |
| Trend data is noisy | Cap trend at 3 points, recompute weekly, show as a separate tag |
| Fit competes with True Fit | Use brand evidence for fit; stay open to partnering |
| Paying brands want better scores | No pay-for-score, written into contracts |

## Next 30 days

- [x] Lock the 27-factor definitions and the data source for each (2026-10-25: `taxonomy/sources.ts`, shown on /how-it-works)
- [x] Refactor the codebase to the new score structure (keep tenants, auth, Claude integration) (done 2026-10-24/25, backend phases B0–B7)
- [x] Build the Evidence agent and Scoring engine for the Fit, Quality and Comfort pillars first (done 2026-10-25, all five pillars, B3–B4)
- [ ] Collect data for 500 tees and jeans; produce the first scores
- [ ] Compare scores with expert picks and owner sentiment; adjust weights (2026-10-26: tool built, `npm run calibrate`: rank agreement with owner stars, keep-vs-return and an expert-picks file, per pillar and per category, biggest disagreements, and nearby weights (±10 points) that would agree better, tuned on independent references only and never applied automatically. Dev check with a fictional expert panel: ρ 0.78, comfort barely tracks any reference, best nearby weights gain 0.045 → keep today's. Needs real expert picks and real data.)
- [ ] Make one sample brand scorecard and show it to 3 brand operators (scorecard built 2026-10-25: `/dashboard/scorecard`, printable; showing it to brands is still to do)
- [ ] Write the pilot one-pager and a 100-brand outreach list (2026-10-25: one-pager at /pilot/one-pager and an outreach tracker at /admin/outreach are built; adding the 100 brands is the team's job)

## Change log

- 2026-10-24 — Added to repo as the source of truth for RPI planning.
- 2026-10-25 — Search: from "at most two questions, only when it changes the top pick" to a shopkeeper-style conversation, up to four questions (chips from stock + free text), always skippable, with chat refinement afterwards. Decided by Asjad.
- 2026-10-25 — Discovery and insights features, mapped from a search platform's product list. In: autosuggest, browse filters, "better-scoring alternatives" recommendations, rule-based collections, enrichment tags (shopper pages + Score API), product Q&A (instant answers from counts + free-text answers from stored evidence, verified), and a brand "why this score" explainer. Out: retail media / sponsored placements and merchandiser boost/bury rules (they break a neutral score; see design principles), and email/SMS (needs a provider, later). Decided by Asjad.
- 2026-10-25 — Pitch changed to "Sales data shows you what sells. Veritas shows you what's worth buying." and a naming rule added: no other company is named in product, marketing, prompt or demo copy. The unsourced-in-public return statistic was removed from the home page. Decided by Asjad.
- 2026-10-25 — B2B focus (details: 04-PLAN-B2B.md). Primary buyers: multi-vendor marketplaces and large retailers; clothing brands second. The score is shown as three drivers (Product quality from reviews, Price, Brand reputation) on top of the unchanged 27-factor engine. Data in production comes from three simple feeds (catalog with prices, reviews, optional returns) via upload or push API. Ads: the score picks which products may be advertised (ad feed labels, verified ad copy, social posts); on-site sponsored slots are labelled, need score 70+, and never appear in the top 3; paying never changes a score. Decided by Asjad.
- 2026-10-25 — Fourth parameter: **Style match**. A vision agent reads each product's own photos (vendor-uploaded) into structured attributes (colours, pattern such as floral or striped, neckline, sleeve, shape, style), so a request like "blue flowered shirt under $40" filters to items that look like that, then ranks them by the score. Style match is per search (how well an item matches what was asked), not part of the product score. Decided by Asjad. Note: the catalog is still tees and jeans, so "shirt" means tees until button-up shirts are added as a category.
- 2026-10-25 — Platform pricing stays "contact us" (annual contract, priced by catalog size) until 2–3 pilots show the value. Competitor analysis stays in this plan as internal-only. Outreach is tracked in an admin tracker; the team adds real brands (no scraped personal contact data). Decided by Asjad.
- 2026-10-25 — Categories widened from t-shirts and jeans to **t-shirts, button-up shirts and jeans** (all three are tops/bottoms everyday staples where all 27 factors apply). Shirt-specific evidence (collar, buttons, wrinkling, sleeve length) maps to existing factors; no new factors. Decided by Asjad.
