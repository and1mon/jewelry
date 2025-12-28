# Jewelry - CD Inlay Generator

A web app for creating printable CD jewel case inserts (front covers and back inlays with spines).

## Features

- Search albums via MusicBrainz
- Automatically fetch cover art from Cover Art Archive
- Customize spine text, colors, fonts, and rotation
- Auto-detect back cover format (with/without spines)
- Smart color extraction for spine backgrounds
- Export print-ready A4 PDF with proper dimensions
- Dark mode support
- Recent albums history

## Usage

1. Search for an album or upload your own cover images
2. Customize the spine text and styling
3. Preview and download the PDF
4. Print on A4 paper and cut along the guides

## Dimensions

- Front cover: 120 x 120 mm
- Back inlay: 150 x 118 mm (including 6mm spines on each side)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Credits

- Album data from [MusicBrainz](https://musicbrainz.org)
- Cover art from [Cover Art Archive](https://coverartarchive.org)

## License

MIT
