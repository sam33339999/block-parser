.PHONY: minify

minify:
	npx terser parser.js -o ./dist/parser.min.js -c -m
	