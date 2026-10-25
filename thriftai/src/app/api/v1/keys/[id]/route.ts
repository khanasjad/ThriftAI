/** DELETE /api/v1/keys/:id — revoke a key of the signed-in brand's tenant (?brand= for admins). */
import { revokeApiKey } from '@/lib/veritas/apikeys'
import { brandForUser, requireApiRole } from '@/lib/veritas/authz'
import { fail, ok } from '@/lib/veritas/http'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireApiRole(['BRAND', 'ADMIN'])
  if (u instanceof Response) return u
  const brand = await brandForUser(u, new URL(req.url).searchParams.get('brand'))
  if (!brand?.tenantId) return fail(404, 'No brand account found')
  const { id } = await params
  return (await revokeApiKey(brand.tenantId, id)) ? ok({ revoked: true }) : fail(404, 'Key not found')
}
