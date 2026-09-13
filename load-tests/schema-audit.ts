import prisma from '../src/lib/prisma';
import fs from 'fs';

async function main() {
  const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
  
  // Parse models from schema.prisma
  const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
  const models: { name: string; fieldCount: number; indexes: string[] }[] = [];
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('//'));
    const fields = lines.filter((l) => !l.startsWith('@@'));
    const indexLines = lines.filter((l) => l.startsWith('@@index') || l.startsWith('@@unique'));
    
    models.push({
      name: modelName,
      fieldCount: fields.length,
      indexes: indexLines,
    });
  }

  console.log(`TOTAL MODELS FOUND: ${models.length}`);
  models.forEach((m) => {
    console.log(`- ${m.name} (${m.fieldCount} fields, ${m.indexes.length} composite indexes/constraints)`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
