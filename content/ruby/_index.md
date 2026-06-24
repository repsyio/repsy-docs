+++
title = "Ruby"
chapter = true
weight = 90
+++

# Ruby

This documentation contains a user guide and samples regarding the use of private and public RubyGems registries in [Repsy](https://repsy.io).

Repsy supports the full **RubyGems / Bundler Compact Index protocol**, which means you can use it as:

- A **hosted registry** — push and pull your own gems with `gem push`, `gem install`, and Bundler.
- A **proxy / cache** — configure Repsy to fetch gems from rubygems.org (or any other upstream source) and cache them locally for faster, more reliable builds.
