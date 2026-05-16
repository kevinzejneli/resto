import { backend } from "../../../../../lib/backend";
import { route } from "../../../../../lib/http";

export const dynamic = "force-dynamic";

export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { services } = backend();
  return route(async () => {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      menuItemId: string;
      quantity?: number;
      notes?: string;
    };
    return services.pos.addLine(id, {
      menuItemId: body.menuItemId,
      quantity: body.quantity ?? 1,
      ...(body.notes ? { notes: body.notes } : {}),
    });
  });
}

export function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { services } = backend();
  return route(async () => {
    const { id } = await ctx.params;
    const index = Number(new URL(request.url).searchParams.get("index"));
    return services.pos.removeLine(id, index);
  });
}
