install:
	yarn install

start:
	yarn start

db:
	yarn sequelize db:migrate

debug:
	DEBUG="app" yarn nodemon -- --watch src -e js,pug --exec yarn gulp server

test:
	yarn test

lint:
	yarn eslint .

.PHONY: test
