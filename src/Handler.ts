import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";
import { extensionManifest } from "./manifest.js";
import type { handler as CopilotExtensionHandler } from "@copilot-extensions/preview-sdk";

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
};

// Attempt to import the handler from the SDK, with a fallback
let sdkHandler: CopilotExtensionHandler | undefined;
try {
  const { handler: sdkHandlerImport } = await import("@copilot-extensions/preview-sdk");
  sdkHandler = sdkHandlerImport;
  console.log("Successfully imported handler from @copilot-extensions/preview-sdk");
} catch (error) {
  console.error("Error importing handler from @copilot-extensions/preview-sdk:", error);
  console.warn("Falling back to custom handler logic.");
}

// Export the handler, prioritizing the SDK's if available
const finalHandler: CopilotExtensionHandler = sdkHandler
  ? sdkHandler(extensionManifest, customHandlerLogic)
  : (extensionManifest, logic) => async (req, secret, key) => {
      console.log("Using fallback handler with custom logic.");
      return logic(req, secret, key);
    };

export default finalHandler;