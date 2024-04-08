# Serverless REST web API.

Name: Pratik Mudliyar
Student ID : W20105247

Video demonstration:  (https://youtu.be/OEIA38jQfZI)

This repository contains an implementation of a serverless REST API for the AWS platform. The CDK framework is used to provision its infrastructure. The API's domain context is movie reviews.

API endpoints.
POST /movies/reviews - add a movie review.
GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id.
GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the film with the specified ID whose rating was higher than the minRating.
GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.
GET /movies/{movieId}/reviews/{year} - Get the reviews written in a specific year for a specific movie.
GET /reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
GET /reviews/{reviewerName}/{movieId}/translation?language=code - Get a translated version of a movie review using the movie ID and reviewer name as the identifier.
PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review.(Table not updated).
Screenshots of API Endpoints.

![Screenshot 2024-04-07 230634](https://github.com/Prratiiik/moviereviews/assets/144805450/5fc20a7b-0a1f-4c4a-b34f-c03093866e57)
![Screenshot 2024-04-07 230429](https://github.com/Prratiiik/moviereviews/assets/144805450/e3dd3bb3-56e0-4b38-b955-4ee221eadfb9)
![Screenshot (178)](https://github.com/Prratiiik/moviereviews/assets/144805450/5009b8d1-eb20-4913-9f90-4e0bc52993ed)
![Screenshot (179)](https://github.com/Prratiiik/moviereviews/assets/144805450/36273cc3-dd63-453b-b54d-21d1cdc95eb5)







Authentication.


Independent learning.
