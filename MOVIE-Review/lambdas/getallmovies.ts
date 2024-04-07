import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, QueryCommandInput, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
      console.log("Event: ", event);
      const reviewerName = event?.pathParameters?.ReviewerName;
        if (!reviewerName) {
            return {
              statusCode: 404,
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ Message: "Missing Reviewer name" }),
            };
          }
          let commandInput: QueryCommandInput = {
            TableName: process.env.TABLE_NAME,
          };
          commandInput = {
            ...commandInput,
            IndexName: "reviewsIx",
            KeyConditionExpression: "ReviewerName = :r",
            ExpressionAttributeValues: {
              ":r": reviewerName,
            },
          };
          const commandOutput = await ddbDocClient.send(
            new QueryCommand(commandInput)
            );
   const body = {
    data: commandOutput.Items
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
  