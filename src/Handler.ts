import handler from "./Handler.js";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";
import { extensionManifest } from "./manifest.js"



export default handler(extensionManifest, async (requestString: string, secret: string, keyID: string) => {
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
    
  const functionToCall = extensionManifest.functions[functionId as keyof typeof extensionManifest.functions];

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
});
