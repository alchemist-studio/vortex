# Vortex

The standalone **Wordmark horizon** landing page, selected from sketch 09.

[Open the website](https://alchemist-studio.github.io/vortex-studio/)

Purple canvas, the original Vortex symbol, Instrument Sans for the headline and wordmark, and JetBrains Mono for the labels. Responsive desktop and phone layouts. The older `/sketches/` URL redirects to the homepage.

## Development

Serve `dist/` with any static server:

```sh
python3 -m http.server 4173 --directory dist
```

No build dependencies or JavaScript are required. Pushing to `main` automatically deploys `dist/` to GitHub Pages using `.github/workflows/pages.yml`.

## Assets

The original logo comes from the [Vortex brief](https://gist.github.com/eonist/6cc957d88e074faa62c5ceed6d7ffa6e). Its paths are preserved. Font files and their SIL Open Font Licenses are bundled under `dist/assets/brand/`. Inclusion does not grant additional rights to the brand artwork.
