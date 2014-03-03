
grep=.

test:
	@./node_modules/.bin/mocha \
		--timeout 20s \
		--require should \
		--reporter spec \
		--grep $(grep)

.PHONY: test
