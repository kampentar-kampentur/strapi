# Strapi Project Rules & Constraints

## City Clusters & Regional Deployment Rules (Permanent Core Rule)
For all operations involving adding, updating, or managing cities and regions (`api::city.city`):

1. **Architecture — Metro City vs. Suburbs**:
   - **Metro City (`metro_city_slug = null`)**: Primary organic landing page. Must contain the complete `page` array (16 blocks) with all media attached. Uses `robots: index, follow`, canonical points to itself (`/[city]/`), included in `sitemap.xml`, HTML sitemap, and `Areas We Serve`.
   - **Suburbs (`metro_city_slug = "metro-slug"`)**: Satellite PPC/local landings. Stored with **empty `page: []`**. Automatically inherits the 16-block layout from the parent metro city via `getMetroCityLayout`. Uses `robots: noindex, follow`, canonical points to the parent metro city (`/[metro-city-slug]/`), excluded from sitemaps to prevent duplicate content penalties.

2. **CRITICAL Strapi v5 Media Relations Rule**:
   - In Strapi v5, media fields in dynamic zone components (`image`, `video`, `badges`, `certificates`) **MUST ALWAYS BE PASSED AS NUMERIC FILE IDs** (e.g., `image: 98`, `badges: [12, 14]`), **NEVER as objects without ID or raw `{ url: "..." }`**.
   - When cloning blocks, NEVER strip IDs from media file objects (`val.mime || val.ext || val.provider ? val.id : ...`). Stripping IDs causes Strapi to set media to `null` (disappearing images bug).
   - Standard TV Mounting Bracket IDs: Fixed (`98`), Tilting (`95`), Full-Motion (`97`), Specialty (`96`).

3. **Input Data Checklist (What is needed to launch a region)**:
   - (1) Metro city name & state code (e.g. `Tampa, FL`).
   - (2) Dedicated phone number: `phone: "+1XXXXXXXXXX"` (E.164) and `phoneLabel: "(XXX) XXX-XXXX"`.
   - (3) Service radius on Google Maps (25–55 miles) or list of 12–18 target suburbs.

4. **How to Select Metro City & Suburbs**:
   - **Metro Core**: The primary economic & organic search center of the MSA. In twin/bipolar metros (Tampa + St. Pete, Dallas + Fort Worth), use the largest city as the metro core (`tampa`), and the twin city as a flagship suburb (`st-petersburg`), explicitly highlighting both in copy.
   - **Suburbs Selection (12–18 per cluster)**:
     * High median household income & single-family home density (higher demand for 65"+ TVs, fireplaces, Frame TV, in-wall wiring).
     * Official cities or large CDPs with population >= 15,000 (meaningful Google search volume).
     * Even geographic distribution across all compass directions covering the 25–55 mile service radius.

5. **SEO & Copywriting Rules («Golden Standard»)**:
   - Always base new city copy on the Houston template (`houston-dump.json`).
   - Use dynamic placeholders `{{city}}` and `{{state}}` so that all suburb satellite pages automatically render their local city name.
   - Use Spintax (`{Option A|Option B}`) for title and paragraph variations.
   - Every city cluster must cover all 8 SEO clusters: (1) surfaces: brick, sheetrock, concrete; (2) fireplaces: gas, stone, mantle mount; (3) Samsung The Frame; (4) in-wall wire concealment; (5) soundbars; (6) TV dismount/unmount; (7) same-day & handyman; (8) pricing transparency.

6. **Deployment & Automation**:
   - Use `deploy-city-cluster.js` with `[city]-parsed.json` to deploy both the metro city and all suburbs in a single automated step:
     ```bash
     cd /Users/kampentar/dev/strapi
     railway run node deploy-city-cluster.js --file=[city]-parsed.json
     ```
