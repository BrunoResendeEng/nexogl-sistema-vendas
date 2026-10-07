import { PrismaClient, Categoria, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  const categorias = Object.values(Categoria);
  for (const categoria of categorias) {
    await prisma.skuSequencia.upsert({
      where: { categoria },
      update: {},
      create: { categoria, proximo: 1 },
    });
  }
  console.log(`✔ SkuSequencia: ${categorias.length} categorias inicializadas`);

  const adminEmail = 'admin@loja.com';
  const senhaHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: { perfil: Perfil.MASTER, senhaHash },
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senhaHash,
      perfil: Perfil.MASTER,
      ativo: true,
    },
  });

  console.log(`✔ Usuário MASTER: ${admin.email} (id: ${admin.id})`);
  console.log('');
  console.log('⚠️  Troque a senha padrão (admin123) após o primeiro login!');
  console.log('🎉 Seed concluído com sucesso.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
