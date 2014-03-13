
REPORTER= spec
grep=.

test:
	@./node_modules/.bin/mocha \
		--timeout 20s \
		--require should \
		--reporter $(REPORTER) \
		--grep $(grep)

test-cov: lib-cov
	@INTEGRATIONS_COV=1 \
		$(MAKE) test \
		REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib lib-cov

clean:
	rm -rf lib-cov
	rm -f coverage.html

.PHONY: test
