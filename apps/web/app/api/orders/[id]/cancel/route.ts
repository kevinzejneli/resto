import { backend } from "../../../../../lib/backend";
import { route } from "../../../../../lib/http";

export const dynamic = "force-dynamic";

export function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { services } = backend();
  return route(async () => {
    const { id } = await ctx.params;
    return services.pos.cancelOrder(id);
  });
}
