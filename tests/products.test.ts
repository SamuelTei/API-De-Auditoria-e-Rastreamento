import request from 'supertest';
import { app, createAdmin } from './helpers';
import { prisma } from '../src/lib/prisma';
import { AuditAction } from '@prisma/client';

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'User', email, password: 'senhaSegura123' });
  return res.body.token as string;
}

describe('Products (recurso auditado)', () => {
  it('lista produtos publicamente, sem autenticação', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('rejeita criação sem token', async () => {
    const res = await request(app).post('/api/v1/products').send({ name: 'X', price: 10 });
    expect(res.status).toBe(401);
  });

  it('cria um produto autenticado e gera um registro de auditoria CREATE', async () => {
    const token = await registerAndLogin('creator@example.com');

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Teclado Mecânico', price: 350.5, quantity: 10 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Teclado Mecânico');

    const logs = await prisma.auditLog.findMany({ where: { entityType: 'Product' } });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditAction.CREATE);
    expect(logs[0].entityId).toBe(res.body.id);
    expect(logs[0].newValue).toMatchObject({ name: 'Teclado Mecânico' });
  });

  it('atualiza um produto e registra o diff (oldValue/newValue) na auditoria', async () => {
    const token = await registerAndLogin('updater@example.com');

    const created = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mouse', price: 100, quantity: 5 });

    const updated = await request(app)
      .patch(`/api/v1/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 80 });

    expect(updated.status).toBe(200);
    expect(updated.body.price).toBe('80');

    const updateLog = await prisma.auditLog.findFirst({
      where: { entityType: 'Product', action: AuditAction.UPDATE },
    });
    expect(updateLog).not.toBeNull();
    expect(updateLog?.oldValue).toMatchObject({ price: '100' });
    expect(updateLog?.newValue).toMatchObject({ price: '80' });
  });

  it('impede que um usuário comum remova um produto (apenas ADMIN)', async () => {
    const token = await registerAndLogin('normaluser@example.com');
    const created = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Monitor', price: 900 });

    const res = await request(app)
      .delete(`/api/v1/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('permite que um ADMIN remova um produto e audita a exclusão', async () => {
    const admin = await createAdmin();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: 'admin12345' });
    const token = login.body.token as string;

    const created = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cadeira', price: 1200 });

    const res = await request(app)
      .delete(`/api/v1/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const deleteLog = await prisma.auditLog.findFirst({
      where: { entityType: 'Product', action: AuditAction.DELETE },
    });
    expect(deleteLog).not.toBeNull();
    expect(deleteLog?.oldValue).toMatchObject({ name: 'Cadeira' });
  });
});
