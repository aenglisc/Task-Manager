install:
	yarn install

start:
	yarn start

debug:
	DEBUG="app" yarn nodemon -- --watch src -e js,pug --exec yarn gulp server

test:
	yarn test

lint:
	yarn eslint .

.PHONY: test
