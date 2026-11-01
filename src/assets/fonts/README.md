# Self-hosted fonts

These four files replace the `fonts.googleapis.com` stylesheet that used to sit
in `<head>`. They are the same faces, the same variable weight axis and the
same subsets Google was already serving to this site, just fetched from our own
origin.

## Why

A local Lighthouse control (mobile, simulated throttling, 4x CPU, same build
served from the same local server) isolated the external font stylesheet as the
single largest cost on the homepage:

| Variant                                   | Performance | Simulated FCP | Simulated LCP |
| ----------------------------------------- | ----------- | ------------- | ------------- |
| Candidate with the Google Fonts stylesheet | 70          | ~3.07 s       | ~5.04 s       |
| Same build, that one `<link>` deleted      | 98          | ~1.32 s       | ~1.41 s       |

First paint was waiting on a cross-origin stylesheet and then a cross-origin
font file. Declaring it `rel="preload" as="style"` and then `media="print"` both
failed to fix that, because the dependency itself was the problem rather than
the way it was declared. Self-hosting removes it.

A second benefit: rendering body text no longer hands every visitor's IP
address to a third party.

## Provenance

Downloaded 2026-10-23 from the URLs the Google Fonts CSS API returns for a
current Chrome user agent, for this exact request:

```
https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=JetBrains+Mono:wght@400&display=swap
```

| File                            | Family         | Subset    | Axis      | Bytes  |
| ------------------------------- | -------------- | --------- | --------- | ------ |
| `inter-latin-var.woff2`         | Inter          | latin     | wght 300-800 | 48256  |
| `inter-latin-ext-var.woff2`     | Inter          | latin-ext | wght 300-800 | 85068  |
| `jetbrains-mono-latin.woff2`    | JetBrains Mono | latin     | 400       | 21168  |
| `jetbrains-mono-latin-ext.woff2`| JetBrains Mono | latin-ext | 400       | 7336   |

Upstream sources: Inter by Rasmus Andersson (<https://github.com/rsms/inter>),
JetBrains Mono by JetBrains (<https://github.com/JetBrains/JetBrainsMono>).

Only the `latin` file is fetched for ordinary English pages. The `latin-ext`
file is gated behind its own `unicode-range` and only downloads if a page
actually renders a character in that range, which matches how Google served
them. Cyrillic, Greek and Vietnamese subsets were not shipped: the site never
requested them in production either, and those characters now fall back to a
system face.

## Licence

Both families are licensed under the SIL Open Font License 1.1, which permits
redistribution. `OFL.txt` in this directory carries both upstream notices and
must stay alongside the font files.

## Where they are declared

`src/styles/global.css`, as four `@font-face` rules carrying the same
`unicode-range` values Google used. Vite fingerprints the files into `_astro/`,
which the deploy workflow serves with the immutable cache policy.

## Updating

Re-run the CSS API request above with a current Chrome user agent, download the
`latin` and `latin-ext` woff2 URLs it returns, and replace these files. Keep
the `unicode-range` values in `global.css` in step with whatever the API
returns, and update the byte counts in the table above.
