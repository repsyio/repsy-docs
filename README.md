# Repsy Docs

repsy-docs contains all documentation content for [docs.repsy.io](https://docs.repsy.io).

# Theme

The site uses [hugo-theme-learn](https://github.com/matcornic/hugo-theme-learn) 2.5.0, unmodified. It is
not committed to this repository: the deploy workflows and the pull request build download the pinned
release into `themes/hugo-theme-learn` (see `.github/actions/setup-hugo-site/action.yml`). For local
development do the same once:

```bash
curl -L https://github.com/matcornic/hugo-theme-learn/archive/2.5.0.tar.gz | tar xz -C themes
mv themes/hugo-theme-learn-2.5.0 themes/hugo-theme-learn
```

`themes/hugo-theme-learn` is git-ignored.

# Running

Please install the Hugo CLI (the workflows use v0.135.0) from [gohugo.io](https://gohugo.io/). For local development you can use.

```bash
hugo -w server
```

For production compilation you can use:

```bash
hugo --minify
```

html content will be in `/public` directory.

# Contribution

Feel free to open pull requests or create tickets.
