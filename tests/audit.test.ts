import request from 'supertest';
import { app, createAdmin } from './helpers';

async function adminToken() {
  const admin = await createAdmin();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.email, password: 'admin12345' });
  return res.body.token as string;
}

async function userToken() {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'User', email: 'plain@example.com', password: 'senhaSegura123' });
  return res.body.token as string;
}

describe('Audit Logs (consulta ao histórico)', () => {
  it('bloqueia acesso de usuários comuns', async () => {
    const token = await userToken();
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('bloqueia acesso sem autenticação', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  it('permite que um ADMIN liste e filtre o histórico por entidade e ação', async () => {
    const token = await adminToken();

    const product = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Notebook', price: 4500 });

    await request(app)
      .patch(`/api/v1/products/${product.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 4200 });

    const res = await request(app)
      .get('/api/v1/audit-logs')
      .query({ entityType: 'Product', action: 'UPDATE' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].entityId).toBe(product.body.id);
    expect(res.body.meta.total).toBe(1);
  });

  it('retorna a linha do tempo completa de uma entidade em ordem cronológica', async () => {
    const token = await adminToken();

    const product = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Teclado', price: 300 });

    await request(app)
      .patch(`/api/v1/products/${product.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 250 });

    await request(app)
      .delete(`/api/v1/products/${product.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/v1/audit-logs/entity/Product/${product.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.events.map((e: { action: string }) => e.action)).toEqual([
      'CREATE',
      'UPDATE',
      'DELETE',
    ]);
  });

  it('exporta o histórico filtrado em CSV', async () => {
    const token = await adminToken();

    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fone', price: 150 });

    const res = await request(app)
      .get('/api/v1/audit-logs/export')
      .query({ entityType: 'Product' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.split('\n')[0]).toBe(
      'id,action,entityType,entityId,userId,userEmail,ipAddress,userAgent,oldValue,newValue,createdAt',
    );
    expect(res.text).toContain('CREATE');
  });

  it('registra um evento LOGIN no histórico ao autenticar', async () => {
    const admin = await createAdmin();
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'admin12345' });

    const token = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'admin12345' })
      .then((r) => r.body.token as string);

    const res = await request(app)
      .get('/api/v1/audit-logs')
      .query({ action: 'LOGIN', userId: admin.id })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
