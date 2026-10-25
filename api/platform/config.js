export default function handler(_request, response) {
  response.setHeader("Content-Type", "application/javascript; charset=utf-8");
  response.status(200).send(`window.__MANUS_CONFIG__=${JSON.stringify({
    projectId: process.env.MANUS_PROJECT_ID || "",
    oauthPortalUrl: process.env.MANUS_OAUTH_PORTAL_URL || "",
    oauthApiUrl: process.env.MANUS_OAUTH_API_URL || ""
  })};`);
}
