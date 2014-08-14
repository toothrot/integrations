
TESTS = $(wildcard test/index.js lib/*/test/*.js)
SRC = lib/*.js lib/*/*.js
REPORTER = spec
GREP ?=.

ifndef NODE_ENV
include node_modules/make-lint/index.mk
endif

test:
	@./node_modules/.bin/mocha $(TESTS) \
		--timeout 20s \
		--require should \
		--reporter $(REPORTER) \
		--grep $(GREP) \
		--bail

test-cov:
	@./node_modules/.bin/istanbul cover \
		node_modules/.bin/_mocha $(TESTS) \
		--report lcovonly \
		-- -u exports \
		--require should \
		--timeout 20s \
		--reporter dot \
		--bail

clean:
	rm -rf coverage

.PHONY: test
