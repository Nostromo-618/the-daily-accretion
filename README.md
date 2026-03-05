# The Daily Accretion

> Exploring the mind, universe, and everything in between

A personal blog built with [Vanduo Framework](https://vanduo.dev) — pure HTML, CSS, and JavaScript with zero dependencies.

## Live Site

**https://accretion.blog**

## Local Development

Serve the site locally:

```bash
npx serve .
```

Then open http://localhost:3000

## Project Structure

```
├── index.html          # Homepage
├── about.html          # About page
├── blog/               # Blog articles
│   ├── index.html
│   ├── ai-bliss.html
│   ├── feed-your-head.html
│   └── year-2025-is-over-finally.html
├── projects/           # Projects showcase
├── vanduo.min.css      # Vanduo CSS (minified)
├── vanduo.min.js       # Vanduo JS (minified)
├── fonts/              # Web fonts
├── icons/              # Phosphor icons
├── images/             # Blog images
├── vercel.json         # Vercel deployment config
├── sitemap.xml         # SEO sitemap
└── robots.txt          # Crawler directives
```

## Adding New Blog Posts

1. Copy an existing blog post HTML file in `/blog/`
2. Update the meta tags, title, and content
3. Add the article to `blog/index.html` and `index.html`
4. Update `sitemap.xml`


## Deployment

This site is published using **GitHub Pages**. Push to the `main` branch to deploy automatically via GitHub Actions.

## Built With

- [Vanduo Framework](https://vanduo.dev) - Pure HTML/CSS/JS framework
- [Phosphor Icons](https://phosphoricons.com) - Icon library

## License

Content © 2025-2026 The Daily Accretion