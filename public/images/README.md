# Drop your artwork photos here

Every image you put in this folder is available to the site at `./images/<filename>`.

## Adding a real artwork

1. Save the photo here, e.g. `aaji-portrait.jpg`
2. Open `src/data/site.js`
3. Find the artwork and change its `image` line:

```js
image: null,                        // before — shows a generated study
image: './images/aaji-portrait.jpg' // after  — shows your photo
```

That is the whole process. The generated placeholder disappears on its own.

## Photographing your work

- **Flat, even light.** Near a window on an overcast day is better than direct sun,
  which blows out graphite highlights and casts a hard shadow from the paper's edge.
- **Shoot square-on**, not at an angle, or the piece will look like a trapezoid.
- **Crop to the artwork.** No desk, no hands, no floor tiles.
- **Portrait pieces: aim for a 4:5 crop** (e.g. 1600 × 2000 px). That is the ratio
  the gallery frames use, so nothing important gets cut off.
- **Resize to about 1600px on the long edge** and export as JPEG at ~80% quality.
  A 6MB phone photo will make the page slow to load on mobile data.

## Files the site looks for by name

| Path | Used for |
| --- | --- |
| `./images/og-cover.jpg` | The preview thumbnail when someone shares your link on WhatsApp or Instagram. 1200 × 630 px. |
| `./images/artist.jpg` | Your photograph in the About section. Set it as `artist.portrait` in `site.js`. |
