export function GET() {
  return new Response("google-site-verification: googlec3126e482d87823c.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
