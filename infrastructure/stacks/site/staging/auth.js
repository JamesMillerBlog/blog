const encoder = new TextEncoder();

function timingSafeEqual(a, b) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export default {
  async fetch(request, env) {
    const authHeader = request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Basic ")) {
      let decoded;
      try {
        decoded = atob(authHeader.slice(6));
      } catch {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Blog", charset="UTF-8"',
            "Content-Type": "text/plain",
          },
        });
      }
      const colonIndex = decoded.indexOf(":");
      const username = colonIndex >= 0 ? decoded.slice(0, colonIndex) : "";
      const password = colonIndex >= 0 ? decoded.slice(colonIndex + 1) : decoded;

      if (timingSafeEqual(username, env.USERNAME) && timingSafeEqual(password, env.PASSWORD)) {
        const url = new URL(request.url);
        if (url.pathname === "/") {
          url.pathname = "/index.html";
        } else if (url.pathname.endsWith("/")) {
          url.pathname = url.pathname + "index.html";
        } else {
          const lastSegment = url.pathname.split("/").pop();
          if (!lastSegment || !lastSegment.includes(".")) {
            url.pathname = url.pathname + ".html";
          }
        }
        return fetch(new Request(url.toString(), request));
      }
    }

    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Blog", charset="UTF-8"',
        "Content-Type": "text/plain",
      },
    });
  },
};
