
test:
	@./node_modules/.bin/mocha \
		--timeout 15000ms \
		--require should \
		--reporter spec

.PHONY: test
