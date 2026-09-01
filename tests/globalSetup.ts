import { execSync } from 'node:child_process';

/** Aplica as migrations no banco de testes antes da suíte rodar. */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}
