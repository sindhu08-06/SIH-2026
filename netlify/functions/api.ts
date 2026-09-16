import serverless from "serverless-http";
import app from "../../server/app";

// Netlify Functions serverless handler for Express API
// Handles both direct invocations and redirected /api/* requests
const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // Prevent unhandled promise rejections or path mismatches
  try {
    return await serverlessHandler(event, context);
  } catch (err: any) {
    console.error("Netlify Serverless Function Error:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Serverless Function Internal Error",
        message: err?.message || String(err),
      }),
    };
  }
};

