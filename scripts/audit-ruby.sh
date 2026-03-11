#!/usr/bin/env bash
set -euo pipefail

ruby_api_version="$(ruby -e 'print RbConfig::CONFIG["ruby_version"]')"
gem_bin_dir="${HOME}/.gem/ruby/${ruby_api_version}/bin"

export PATH="${gem_bin_dir}:${PATH}"

if ! command -v bundle-audit >/dev/null 2>&1; then
  gem install --user-install bundler-audit --no-document
fi

bundle-audit check --update
