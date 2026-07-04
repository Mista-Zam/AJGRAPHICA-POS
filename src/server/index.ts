import { withSupabase } from "@supabase/server"
import * as handlers from "./handlers"

const routes: Record<string, (req: Request) => Promise<Response>> = {
  "GET /health": handlers.health,
  "GET /services": handlers.listServices,
  "GET /jobbings": handlers.getJobbings,
  "POST /jobbings": handlers.createJobbing,
  "PUT /jobbings": handlers.updateJobbing,
  "DELETE /jobbings": handlers.deleteJobbing,
  "GET /finances": handlers.getFinances,
  "GET /settings": handlers.getSettings,
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req) => {
    const url = new URL(req.url)
    const key = `${req.method} ${url.pathname}`
    const handler = routes[key]
    if (!handler) return new Response("Not found", { status: 404 })
    return handler(req)
  }),
}


