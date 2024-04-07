import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;

    const movieId = parameters?.movieId
      ? parseInt(parameters.movieId)
      : undefined;
    const yearorReviewer = parameters?.Parameter;

    if (!movieId && !yearorReviewer) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id or parameter" }),
      };
    }
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
    if (!isNaN(Number(yearorReviewer))) {
      commandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "movieId = :m AND begins_with(ReviewDate, :yr)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":yr": yearorReviewer,
        },
      };
    } else {
      commandInput = {
        TableName: process.env.TABLE_NAME,
        IndexName: "reviewerIx",
        KeyConditionExpression:
          "movieId = :m AND begins_with(ReviewerName, :rn)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":rn": yearorReviewer,
        },
      };
    }
    console.log(commandInput);

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id or ReviewerName" }),
      };
    }
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}