require('dotenv').config();
module.exports = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,

    DB_URI: process.env.DB_URI,
    DB_NAME: 'gojek',
    SLACK_AUTH_TOKEN: process.env.SLACK_AUTH_TOKEN,
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_VERIFICATION_TOKEN: process.env.SLACK_VERIFICATION_TOKEN
}