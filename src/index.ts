import { createServer, type IncomingMessage } from "node:http";

import { verifyAndParseRequest, transformPayloadForOpenAICompatibility, getFunctionCalls, createDoneEvent, createReferencesEvent } from "@copilot-extensions/preview-sdk";
import Groq from "groq-sdk";

import { describeModel } from "./functions/describe-model.js";
import { executeModel } from "./functions/execute-model.js";
import { listModels } from "./functions/list-models.js";
import { RunnerResponse } from "./functions.js";
import { recommendModel } from "./functions/recommend-model.js";
import { ModelsAPI } from "./models-api.js";

const server = createServer(async (request, response) => {
  if (request.method === "GET") {
    response.statusCode = 200;
    response.end(`OK`);
    return;
  }

  const body = await getBody(request);

  let verifyAndParseRequestResult: Awaited<ReturnType<typeof verifyAndParseRequest>>;
  const apiKey = request.headers["x-github-token"] as string;
  try {
    const signature = request.headers["x-github-public-key-signature"] as string;
    const keyID = request.headers["x-github-public-key-identifier"] as string;
    verifyAndParseRequestResult = await verifyAndParseRequest(body, signature, keyID, {
      token: apiKey,
    });
  } catch (err) {
    console.error(err);
    response.statusCode = 401
    response.end("Unauthorized");
    return
  }

  const { isValidRequest, payload } = verifyAndParseRequestResult

  if (!isValidRequest) {
    console.log("Signature verification failed");
    response.statusCode = 401
    response.end("Unauthorized");
  }

  console.log("Signature verified");

  const compatibilityPayload = transformPayloadForOpenAICompatibility(payload);

  // Use the GitHub API token sent in the request
  if (!apiKey) {
    response.statusCode = 400
    response.end()
    return;
  }

  // List of functions that are available to be called
  const modelsAPI = new ModelsAPI(apiKey);

  const functions = [listModels, describeModel, executeModel, recommendModel];

  // Use the Copilot API to determine which function to execute
  const capiClient = new OpenAI({
    baseURL: "https://api.githubcopilot.com",
    apiKey,
  });

  // Prepend a system message that includes the list of models, so that
  // tool calls can better select the right model to use.
  const models = await modelsAPI.listModels();

  const toolCallMessages = [
    {
      role: "system" as const,
      content: [
        "You are an extension of GitHub Copilot, built to interact with Groq Cloud Models.",
        "Groq is a cloud based platform where Groq cloud models serving a number of popular open weight models at high inference speeds. Models include Meta's Llama 3, Mistral AI's Mixtral, and Google's Gemma.",
        "Here is a list of some of the models available to the user:",
        "<-- LIST OF MODELS -->",
        JSON.stringify(
          [...models.map((model) => ({
            friendly_name: model.displayName,
            name: model.name,
            publisher: model.publisher,
            registry: model.registryName,
            description: model.summary,
          })),
          {
            friendly_name: "Google gemma-9b-it",
            name: "gemma2-9b-it",
            publisher: "google",
            model_registry: "groq",
            description: "Gemma 2 is Google's latest iteration of open LLMs. It comes in two sizes, 9 billion and 27 billion parameters with base (pre-trained) and instruction-tuned versions. Gemma is based on Google Deepmind Gemini and has a context length of 8K tokens: gemma-2-9b: Base 9B model."
          },
          {
            friendly_name: "Meta meta-llama/llama-4-maverick-17b-128e-instruct",
            name: "llama-4-maverick-17b-128e-instruct",
            publisher: "meta",
            model_registry: "meta-llama",
            description: "Llama 4 Scout was pretrained on ~40 trillion tokens and Llama 4 Maverick was pretrained on ~22 trillion tokens of multimodal data from a mix of publicly available, licensed data and information from Meta’s products and services. This includes publicly shared posts from Instagram and Facebook and people’s interactions with Meta AI."
          },
        ]
        ),
        "<-- END OF LIST OF MODELS -->",
      ].join("\n"),
    },
    ...compatibilityPayload.messages,
  ];

  console.time("tool-call");
  const toolCaller = await capiClient.chat.completions.create({
    stream: false,
    model: "gemma2-9b-it",
    messages: toolCallMessages,
    tools: functions.map((f) => f.tool),
  });
  console.timeEnd("tool-call");

  const [functionToCall] = getFunctionCalls(
    // @ts-expect-error - type error due to Copilot/OpenAI SDKs interop, I'll look into it ~@gr2m
    toolCaller.choices[0]
  )

  if (
    !functionToCall
  ) {
    console.log("No tool call found");
    // No tool to call, so just call the model with the original messages
    const stream = await capiClient.chat.completions.create({
      stream: true,
      model: "gemma2-9b-it",
      messages: compatibilityPayload.messages,
    })

    for await (const chunk of stream) {
      const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
      response.write(chunkStr);
    }

    response.end(createDoneEvent());
    return;
  }

  const args = JSON.parse(functionToCall.function.arguments);

  console.time("function-exec");
  let functionCallRes: RunnerResponse;
  try {
    console.log("Executing function", functionToCall.function.name);
    const funcClass = functions.find(
      (f) => f.definition.name === functionToCall.function.name
    );
    if (!funcClass) {
      throw new Error("Unknown function");
    }

    console.log("\t with args", args);
    const func = new funcClass(modelsAPI);
    functionCallRes = await func.execute(
      compatibilityPayload.messages,
      args
    );
  } catch (err) {
    console.error(err);
    response.statusCode = 500
    response.end();
    return;
  }
  console.timeEnd("function-exec");

  // Now that we have a tool result, let's use it to call the model.
  try {
    let stream: AsyncIterable<any>;

    if (functionToCall.function.name === executeModel.definition.name) {
      // First, let's write a reference with the model we're executing.
      // Fetch the model data from the index (already in-memory) so we have all the information we need
      // to build out the reference URLs
      const modelData = await modelsAPI.getModelFromIndex(functionCallRes.model);
      const sseData = {
        type: "models.reference",
        id: `models.reference.${modelData.name}`,
        data: {
          model: functionCallRes.model
        },
        is_implicit: false,
        metadata: {
          display_name: `Model: ${modelData.name}`,
          display_icon: "icon",
          display_url: `https://github.com/marketplace/models/${modelData.registryName}/${modelData.name}`,
        }
      };
      const event = createReferencesEvent([sseData]);
      response.write(event);

      if (["o1-mini", "o1-preview"].includes(args.model)) {
        // for non-streaming models, we need to still stream the response back, so we build the stream ourselves
        stream = (async function*() {
          const result = await modelsAPI.inference.chat.completions.create({
            model: functionCallRes.model,
            messages: functionCallRes.messages
          });
          yield result;
        })();
      } else {
        stream = await modelsAPI.inference.chat.completions.create({
          model: functionCallRes.model,
          messages: functionCallRes.messages,
          stream: true
        });
      }
    } else {
      stream = await capiClient.chat.completions.create({
        stream: true,
        model: "gemma2-9b-it",
        messages: functionCallRes.messages,
      });
    }

    console.time("streaming");
    for await (const chunk of stream) {
      const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
      response.write(chunkStr);
    }

    response.end(createDoneEvent());
    console.timeEnd("streaming");
  } catch (err) {
    console.error(err);

    if ((err as any).response && (err as any).response.status === 400) {
      console.error('Error 400:', (err as any).response.data);
    }

    response.statusCode = 500
    response.write("data: Something went wrong\n\n")
    response.end()
  }
});

const port = process.env.PORT || "3000"
server.listen(port);
console.log(`Server running at http://localhost:${port}`);

function getBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const bodyParts: Buffer[] = [];
    let body;
    request
      .on("data", (chunk: Buffer) => {
        bodyParts.push(chunk);
      })
      .on("end", () => {
        resolve(Buffer.concat(bodyParts).toString());
      });
  });
}
