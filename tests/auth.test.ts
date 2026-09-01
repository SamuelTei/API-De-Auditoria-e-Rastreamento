import request from 'supertest';
import { app } from './helpers';

describe('Auth', () => {
  it('registra um novo usuário e retorna um token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Samuel',
      email: 'samuel@example.com',
      password: 'senhaSegura123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('samuel@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejeita registro com e-mail duplicado', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Samuel',
      email: 'dup@example.com',
      password: 'senhaSegura123',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Outro',
      email: 'dup@example.com',
      password: 'outraSenha123',
    });

    expect(res.status).toBe(409);
  });

  it('rejeita registro com payload inválido', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'invalido' });
    expect(res.status).toBe(400);
  });

  it('autentica um usuário existente', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Samuel',
      email: 'login@example.com',
      password: 'senhaSegura123',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'senhaSegura123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejeita login com senha incorreta', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Samuel',
      email: 'wrongpass@example.com',
      password: 'senhaSegura123',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'errada' });

    expect(res.status).toBe(401);
  });
});
