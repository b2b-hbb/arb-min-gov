# Makefile

.PHONY: dev test

dev:
	open http://localhost:8000 & python3 -m http.server 8000

test:
	node ./test/abi.t.js
