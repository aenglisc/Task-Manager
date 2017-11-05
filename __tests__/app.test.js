/* eslint object-curly-newline: ["error", { "minProperties": 5 }] */

import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '../src';
import init from '../src/init';

const createUser = id => ({
  id,
  email: faker.internet.email(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  password: faker.internet.password(),
});

describe('Basic', () => {
  const server = app().listen();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('Homepage', async () => {
    const res = await request.agent(server).get('/');
    expect(res).toHaveHTTPStatus(200);
  });

  it('404', async () => {
    const res = await request.agent(server).get('/void');
    expect(res).toHaveHTTPStatus(404);
  });
});

describe('User session', () => {
  const { email, firstName, lastName, password } = createUser(1);
  const server = app().listen();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
    await init();
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('Sign up', async () => {
    await request
      .agent(server)
      .post('/users')
      .type('form')
      .send({ form: { email, firstName, lastName, password } })
      .expect(302);
  });

  it('Sign in', async () => {
    await request
      .agent(server)
      .post('/sessions')
      .type('form')
      .send({ form: { email, password } })
      .expect(302);
  });

  it('Sign out', async () => {
    await request
      .agent(server)
      .post('/sessions')
      .type('form')
      .send({ form: { email, password } })
      .expect(302);
    await request
      .agent(server)
      .delete('/sessions')
      .expect(302);
  });
});
