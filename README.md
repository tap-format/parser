# tap-format parser [![Travis](https://img.shields.io/travis/rust-lang/rust.svg?style=flat-square)](https://travis-ci.org/tap-format/parser)
A highly verbose parser for the [Test Anything Protocol](https://testanything.org/) that exposes an [observable](https://github.com/Reactive-Extensions/RxJS) and streaming interface.

This is the parser used to create the following beautiful TAP formatters:

* [@tap-format/spec](https://github.com/tap-format/spec) - Formatted TAP output the like the Mocha spec reporter
* [@tap-format/dot](https://github.com/tap-format/dot) - Formatted TAP output with dots ...
* [@tap-format/failures](https://github.com/tap-format/failures) - Formatted output for TAP assertion failures with diffs
* [@tap-format/results](https://github.com/tap-format/results) - Formatted output for TAP runner results

### Node Version Support

* 0.10
* 0.12
* iojs
* >= 4.x

## Install

```
npm install @tap-format/parser --save
```

## Usage

### Observable Interface

The parser exposes an interface that lets you deal with the parsed TAP with [Reactive Extensions](https://github.com/Reactive-Extensions/RxJS). See the [API]() section for a full list of exposed Observables.

```js
var parse = require('@tap-format/parser')

var stream = process.stdin
var tap$ = parser.observeStream(stream)

tap$.tests$
	.forEach(function (test) {
		console.log(test.title)
	})

tap$.asserions$
	.forEach(function (assertion) {
		console.log(assertion.title)
	})
```

### Streaming Interface

The parser will parse streaming data for any source.

```js
var parser = require('@tap-format/parser')
var H = require('highland')

var tapStream = H(process.stdin.pipe(parser.stream()))

var tests = tapStream.filter(function (line) {
	return line.type === 'test'
})

var assertions = tapStream.filter(function (line) {
	return line.type === 'assertion'
})

tests.each(function (test) {
	console.log(test.title)
})

assertions.each(function (assertion) {
	console.log(assertion.title)
})

```

### CLI

```
$ something-that-produces-tap | tap-format-parser
{
	// Parsed TAP output as JSON here
}
```

## API

### Observable Interface

Given a streaming input, the parser will expose and [RXjs Observable](https://github.com/Reactive-Extensions/RxJS) chunked by new lines. In addition, the parser exposes the following properties as Observables as convenience methods for the parsed TAP.

```js
var parser = requrie('@tap-format/parser')

var stream = process.stdin
var tap$ = parser.observeStream(stream)
```

* * *

#### tap$

An Observable of all parsed output for the given input TAP stream

```js
// This will console.log every assertion title
tap$
	.filter(function (line) {
		return line.type === 'assertion'
	})
	.forEach(function (assertion) {
		console.log(assertion.title)
	})
```

* * *

#### tap$.tests$

An Observable of all parsed tests.

```js
// This will console.log all test titles
tap$.tests$
	.map(function (test) {
		return 'TEST: ' + test.title
	})
	.forEach(console.log.bind(console))
```
The shape of the **test** object is as follows:

* **raw** - the raw test line TAP from the TAP input (i.e. `# My Test`)
* **type** - the type of the line. This will always be `test`
* **title** -  the parsed test title. `# My Test` becomes `My Test`
* **lineNumber** - the line number of the TAP input
* **testNumber** - the test number from the TAP input

* * *

#### tap$.assertions$

An Observable of all parsed assertions.

```js
// This will console.log all assertion titles
tap$.assertions$
	.map(function (assertion) {
		return (assertion.ok ? 'OK: ' : 'NOT OK: ') + assertion
	})
	.forEach(console.log.bind(console))
```
The shape of the **assertion** object is as follows:

* **raw** - the raw test line TAP output, including any diagnostic associated with it
* **type** - the type of the line. This will always be `assertion`
* **title** -  the parsed test title, excluding any diagnostic associated with it
* **ok** - `true/false` - indicates whether the assertion passed or failed
* **diagnostic** - an object of any diagnostic associated with the assertion. If the assertion is `not ok`, this will be information about the expected and actual values, etc. The TAP input will be YAML, but this value will always be an object
* **rawDiagnostic** - the raw diagnostic fromt he TAP input
* **assertionNumber** - the assertion number from the TAP input
* **lineNumber** - the line number of the TAP input
* **testNumber** - the test number that the assertion is within from the TAP input

* * *

#### tap$.comments$

An Observable of all output that is not tap. The parser assumes these are from `console.log()` and treats them as *comments*.

```js
// This will console.log all the comment titles
tap$.comments$
	.map(function (comment) {
		return 'COMMENT: ' + comment.title
	})
	.forEach(console.log.bind(console))
```
The shape of the **comment** object is as follows:

* **raw** - the raw comment line from the TAP input
* **type** - the type of the line. This will always be `comment`
* **title** -  the parsed comment title
* **lineNumber** - the line number of the TAP input

* * *

#### tap$.results$

An Observable of the parsed TAP results. This will only ever be of type `tests`, `pass`, or `fail`.

```js
// This will console.log the names and counts of the results
tap$.results$
	.forEach(function (result) {
		console.log(result.name + ' ' + result.count)
	})
```
The shape of the **result** object is as follows:

* **raw** - the raw result line from the TAP input (i.e. `# pass 3`)
* **type** - the type of the line. This will always be `result`
* **name** - the name of the result (i.e. pass, fail, assertions, etc.)
* **count** - the number of assertions associated with this result

* * *

#### tap$.plans$

An Observable of all parsed plans given from TAP output. This is usually only one item.

```js
// This will console.log the 'from' and 'to' from the plan
tap$.plans$
	.forEach(function (plan) {
		console.log('FROM: ' + plan.from')
		console.log('TO: ' + plan.to')
	})
```
The shape of the **plan** object is as follows:

* **raw** - the raw plan line TAP output (i.e. `1..7`)
* **type** - the type of the line. This will always be `plan`
* **from** - this will almost always be `1`
* **to** - the total number of assertions from the TAP input
* **skip** - the number of assertions skipped

* * *

#### tap$.versions$

An Observable of the parsed TAP version

```js
// This will console.log the TAP version
tap$.versions$
	.forEach(function (version) {
		console.log(version.raw)
	})
```
The shape of the **version** object is as follows:

* **raw** - the raw version line TAP output (i.e. `TAP version 13`)
* **type** - the type of the line. This will always be `version`

* * *

### Streaming Interface

Using `require('@tap-format/parser').stream()` returns a new-line-chunked stream of parsed TAP. It is a normal stream, and therefore exposes the very useful `pipe()` method.

## Run Tests

```
git clone git@github.com:scottcorgan/tap-out.git .
npm install
npm test
```
