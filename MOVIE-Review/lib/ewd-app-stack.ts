import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { movieReviews } from "../seed/moviereviews";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { generateBatch } from "../shared/util";



export class EwdAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "ReviewDate", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });
    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewerIx",
      sortKey: { name: "ReviewerName", type: dynamodb.AttributeType.STRING },
    });
    movieReviewsTable.addGlobalSecondaryIndex({
      indexName: "reviewsIx",
      partitionKey: {
        name: "ReviewerName",
        type: dynamodb.AttributeType.STRING,
      },
    });
    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      environment: {
        TABLE_NAME: movieReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    };
    const getmoviebyid = new lambdanode.NodejsFunction(
      this,
      "getmoviebyid",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getmoviebyid.ts`,
      }
    );
    const getmoviecastmember = new lambdanode.NodejsFunction(
      this,
      "getmoviecastmember",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getmoviecastmember.ts`,
      }
    );
    const getallmovies = new lambdanode.NodejsFunction(
      this,
      "getallmovies",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/getallmovies.ts`,
      }
    );
    const addmovies = new lambdanode.NodejsFunction(
      this,
      "addmovies",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/addmovies.ts`,
      }
    );
    const updatemoviereview = new lambdanode.NodejsFunction(
      this,
      "updatemoviereview",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/updatemoviereview.ts`,
      }
    );
    const gettranslatedreviews = new lambdanode.NodejsFunction(
      this,
      "gettranslatedreviews",
      {
        ...appCommonFnProps,
        entry: `${__dirname}/../lambdas/gettranslatedreviews.ts`,
      }
    );
    gettranslatedreviews.addToRolePolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText'],
      resources: ['*'],
    }));
    // REST API
    const api = new apig.RestApi(this, "RestAPI", {
      description: "MovieReview api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });
    const moviesEndpoint = api.root.addResource("movies");
    const movieIdEndpoint = moviesEndpoint.addResource("{movieId}");

    const reviewsEndpoint = movieIdEndpoint.addResource("reviews");
    moviesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addmovies, { proxy: true })
    );
    reviewsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getmoviebyid, { proxy: true })
    );
    const reviewerEndpoint = reviewsEndpoint.addResource("{Parameter}");
    reviewerEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getmoviecastmember)
    );
    reviewerEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updatemoviereview)
    );
    const allreviewsEndpoint = api.root.addResource("reviews");
    const allreviewsbyreviewerEndpoint =
      allreviewsEndpoint.addResource("{ReviewerName}");
    allreviewsbyreviewerEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getallmovies, { proxy: true })
    );
    const translate = allreviewsbyreviewerEndpoint.addResource("{movieId}");
    const translatedreviewEndpoint = translate.addResource("translation");
    translatedreviewEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(gettranslatedreviews)
    );

    movieReviewsTable.grantReadData(getmoviebyid);
    movieReviewsTable.grantReadData(getmoviecastmember);
    movieReviewsTable.grantReadData(getallmovies);
    movieReviewsTable.grantReadWriteData(addmovies);
    movieReviewsTable.grantReadWriteData(updatemoviereview);
    movieReviewsTable.grantReadData(gettranslatedreviews);

    new custom.AwsCustomResource(this, "moviereviewsddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of(
          "moviereviewsddbInitData"
        ),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],
      }),
    });
  }
}
