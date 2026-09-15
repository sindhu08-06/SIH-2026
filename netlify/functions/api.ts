import serverless from "serverless-http";
import app from "../../server/app";

// Netlify Functions serverless handler for Express API
const handler = serverless(app);

export { handler };
