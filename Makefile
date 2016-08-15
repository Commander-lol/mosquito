BIN=./node_modules/.bin

build:
	@$(BIN)/babel src -d lib

lint:
	@$(BIN)/eslint src

fix:
	@$(BIN)/eslint --fix src

flow:
	@$(BIN)/flow src