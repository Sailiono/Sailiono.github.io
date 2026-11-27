# Clark Cui — Portfolio

Source for [sailiono.github.io](https://sailiono.github.io), a dependency-free bilingual portfolio hosted with GitHub Pages.

## Local preview

```bash
python3 -m http.server 8765
```

Open <http://localhost:8765>.

## Structure

- `index.html` — selected direction-B bilingual portfolio (Aerakia and LifHalo);
- `directions/b.html` — matching standalone direction-B preview; keep its content in sync with the home page, adjusting relative paths;
- `directions/b.css` and `directions/b.js` — selected visual system, scroll-linked diagrams and actual replay curves, language and motion controls;
- `directions/cases.css` — matching palette for the algorithm case study;
- `styles.css` and `script.js` — existing case-page layout and bilingual behavior;
- `assets/evidence/` — public algorithm outputs and owner-authorized validation summaries; no private source or device records;
- `404.html` — GitHub Pages fallback;
- `robots.txt` and `sitemap.xml` — search-engine discovery.

The full flight stack and LifHalo are presented as functions, architecture and reviewed results only. Their private source, protocols and product resources are not included. The removed RTK, Splicia and SBUS projects remain accessible only through existing archive URLs, not the main showcase.

No build step or third-party runtime dependency is required. The main page and direction-B preview retain readable complete charts without JavaScript and respect reduced-motion preferences. With JavaScript, readers can pause motion or show the full replay curves directly.
