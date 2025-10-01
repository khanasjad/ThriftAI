import { prisma } from '../src/lib/prisma'

async function checkDynamicSpecs() {
  const product = await prisma.product.findFirst({
    where: {
      name: { contains: 'Puma Elite', mode: 'insensitive' },
      category: 'BASKETBALL_SHOES'
    },
    select: {
      id: true,
      name: true,
      dynamicSpecs: true
    }
  })

  console.log('Product:', product?.name)
  console.log('Current dynamicSpecs:', JSON.stringify(product?.dynamicSpecs, null, 2))

  await prisma.$disconnect()
}

checkDynamicSpecs()
