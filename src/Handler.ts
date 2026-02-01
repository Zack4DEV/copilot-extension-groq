import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";
import { extensionManifest } from "./manifest.js";

// Define a type for your custom handler logic
type CustomHandlerLogic = (
  requestString: string,
  secret: string,
  keyID: string
) => Promise<{ statusCode: number; body: string }>;

// Define your custom handler logic
const customHandlerLogic: CustomHandlerLogic = async (
  requestString: string,
  secret: string,
  keyID: string
) => {
  console.log("requestString", requestString);
  console.log("secret", secret);
  console.log("keyID", keyID);

  if (!requestString) {
    return {
      statusCode: 200,
      body: "OK",
    };
  }

  try {
    const request = await verifyAndParseRequest(requestString, secret, keyID);

    if (!request || !request.isValidRequest) {
      return {
        statusCode: 401,
        body: "Invalid request signature",
      };
    }

    const payload = request.payload;

    const toolInvocation = (payload as any)?.toolInvocation;

    if (!toolInvocation) {
      return {
        statusCode: 400,
        body: "Missing toolInvocation in payload.",
      };
    }

    const { functionId, arguments: args } = toolInvocation;

    const functionToCall =
      extensionManifest.functions[
        functionId as keyof typeof extensionManifest.functions
      ];

    if (!functionToCall) {
      return {
        statusCode: 404,
        body: `Function ${functionId} not found.`,
      };
    }

    const result = await functionToCall.run(args);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: "Internal server error",
    };
  }
};

// Export the handler
export default async (req: any, secret: any, key: any) => {
  console.log("Using fallback handler with custom logic.");
  return customHandlerLogic(req, secret, key);
};
