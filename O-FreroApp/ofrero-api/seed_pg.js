import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://app:app@127.0.0.1:5432/database?schema=public"
});

async function main() {
  await client.connect();

  // user demo
  await client.query(`
    INSERT INTO "User"(email,"passwordHash",name,role)
    VALUES ('demo@pizza.io','hash-demo','Demo','USER')
    ON CONFLICT (email) DO NOTHING;
  `);

  // produits de base
  await client.query(`
    INSERT INTO "Product"(name,description,"priceCents","isAvailable")
    VALUES
      ('Margherita','Tomate, mozzarella, basilic',900,true),
      ('Regina','Jambon, champignons, mozzarella',1200,true)
    ON CONFLICT DO NOTHING;
  `);

  const { rows: users } = await client.query(`SELECT id,email FROM "User"`);
  const { rows: products } = await client.query(`SELECT id,name FROM "Product"`);

  console.log('✅ Seed OK :', { users, products });
  await client.end();
}

main().catch(async (e) => {
  console.error('❌ Seed error:', e);
  try { await client.end(); } catch {}
  process.exit(1);
});
