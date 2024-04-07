import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
      console.log("Event: ", event);
      const parameters = event?.pathParameters;
      const queryparams= event?.queryStringParameters;
      const movieId = parameters?.movieId
        ? parseInt(parameters.movieId)
        : undefined;
        const minRating = queryparams?.minRating ? parseInt(queryparams.minRating) : undefined;
        if (!movieId) {
            return {
              statusCode: 404,
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ Message: "Missing movie Id" }),
            };
          }
          let commandInput: QueryCommandInput = {
            TableName: process.env.TABLE_NAME,
          };
          commandInput = {
            ...commandInput,
            KeyConditionExpression: "movieId = :m",
            ExpressionAttributeValues: {
              ":m": movieId,
            },
          };
          if (minRating !== undefined) {
            commandInput.FilterExpression = "#Rating >= :minRating";
            commandInput.ExpressionAttributeNames = { "#Rating": "Rating" };
            commandInput.ExpressionAttributeValues![":minRating"] = minRating;
        }
          const commandOutput = await ddbDocClient.send(
            new QueryCommand(commandInput)
            );
     
    let body={
        data:commandOutput.Items
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