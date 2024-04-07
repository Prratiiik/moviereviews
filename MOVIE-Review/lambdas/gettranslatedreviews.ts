import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import * as AWS from "aws-sdk";


const ddbDocClient = createDDbDocClient();
const translate = new AWS.Translate();
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    
    const parameters = event?.pathParameters;
    const reviewerName = parameters?.ReviewerName;
    const movieId = parameters?.movieId
    ? parseInt(parameters.movieId)
    : undefined;
    const queryparams = event?.queryStringParameters || {};
    if (!reviewerName || !movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing Reviewer name or movieId" }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };
    commandInput = {
      ...commandInput,
      IndexName: "reviewerIx",
      KeyConditionExpression: "movieId = :m and begins_with(ReviewerName, :r) ",
      ExpressionAttributeValues: {
        ":m": movieId,
        ":r": reviewerName,
      },
    };
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );

    let body: { data: Record<string, any>[] } = {
      data: commandOutput.Items ||[],
    };
    if (queryparams.language) {
      const translateParams = {
        Text: JSON.stringify(body), 
        SourceLanguageCode: 'en',
        TargetLanguageCode: queryparams.language,
      };
      console.log(translateParams)
      const translatedMessage = await translate.translateText(translateParams).promise();

      // Update the body with translated message
      body.data = [{ TranslatedText: translatedMessage.TranslatedText }];
    }
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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