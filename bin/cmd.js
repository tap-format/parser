#!/usr/bin/env node

var parse = require('../')

process.stdin
  .pipe(parse.stream())
  .pipe(process.stdout)
