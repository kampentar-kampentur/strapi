---
name: city-cluster-deployment
description: Standard operating procedure for creating, copywriting, media-linking, and deploying new metro city clusters and suburb satellite pages in TVPro (Strapi v5 + Next.js). Use whenever creating, adding, or managing cities, suburbs, or regions.
---

# City Cluster Deployment Skill

This skill documents the end-to-end procedure for expanding TVPro to new metropolitan areas and their suburban clusters.

## Core Principles & Architecture

1. **Metro City (`metro_city_slug = null`)**:
   - The primary regional hub.
   - Contains all 16 page blocks with media relations directly linked.
   - Indexed by Google (`robots: index, follow`), canonical points to itself (`https://tvprousa.com/[city]/`).
   - Included in `sitemap.xml`, HTML sitemap, and `Areas We Serve`.

2. **Suburbs (`metro_city_slug = "[metro-slug]"`)**:
   - Satellite landing pages within the 25–55 mile service radius.
   - Created with an **empty `page: []`** in Strapi DB.
   - Automatically inherits the 16-block layout from the parent metro city via `getMetroCityLayout`.
   - Uses `robots: noindex, follow` and `canonical: https://tvprousa.com/[metro-slug]/` to prevent duplicate content penalties.
   - Dynamically interpolates `{{city}}` and `{{state}}` into all headings and paragraphs.

## Critical Strapi v5 Media Rule

> In Strapi v5, media fields inside dynamic zone components (`image`, `video`, `badges`, `certificates`) **MUST ALWAYS BE PASSED AS NUMERIC FILE IDs** (e.g., `image: 98`), **NEVER as objects without ID or raw `{ url: "..." }`**.
> Stripping IDs causes Strapi to silently write `null`, resulting in the "missing images on live website" bug.

### Standard Bracket Media IDs:
- Fixed Mount: `98`
- Tilting Mount: `95`
- Full-Motion Mount: `97`
- Specialty Mount: `96`

## Step-by-Step Execution Workflow

1. **Gather Data**:
   - City name, 2-letter state code, kebab-case URL slug.
   - Dedicated phone number (E.164 `+1XXXXXXXXXX` and display `(XXX) XXX-XXXX`).
   - 10–18 suburbs within the 25–55 mile radius (from Google Maps / county borders).

2. **Generate Config File (`[city]-parsed.json`)**:
   - Follow the Golden Standard of Houston (`houston-dump.json`).
   - Include all 8 mandatory SEO clusters (brick, sheetrock, concrete, fireplaces, Frame TV, in-wall cable hiding, soundbars, same-day/handyman).
   - Use Spintax `{Option A|Option B}` and placeholders `{{city}}` / `{{state}}`.

3. **Deploy via Universal Automation Script**:
   - Run in the `strapi` directory:
     ```bash
     cd /Users/kampentar/dev/strapi
     railway run node deploy-city-cluster.js --file=[city]-parsed.json
     ```

4. **Verify Deployment**:
   - Verify that REST API returns all 16 blocks and non-null media URLs.
   - Verify that suburbs have `metro_city_slug` pointing to the metro city and inherit the layout.

5. **Revalidate / Rebuild Frontend**:
   - Next.js uses static site generation with `force-cache`. A rebuild or deployment is required for the static pages to pick up new Strapi data in production.

## Reference Documentation
- Deployment Automation Script: `deploy-city-cluster.js`
- JSON Master Files: `las-vegas-parsed.json`, `san-antonio-parsed.json`, `irvine-parsed.json`, `tampa-parsed.json`.
