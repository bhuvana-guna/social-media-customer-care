const SlackBot = require('slackbots');
var db = require('./../db');
var config = require('./../config.js');
var helper = require('./../helper')
var orders = require('./order.json')
const bot = new SlackBot({
    token: config.SLACK_AUTH_TOKEN,
    name: 'superservice'
});

let attachments =  [{
    "color": "#9C1A22",
    "mrkdwn_in": ["text","fields"],
    "actions": [
        {
            "name": "category",
            "text": "SPAM",
            "style": "danger",
            "type": "button",
            "value": "chess",
            "confirm": {
                "title": "Are you sure?",
                "text": "Is it really spam?",
                "ok_text": "Yes",
                "dismiss_text": "No"
            }
        },
        {
            "name": "category",
            "text": "Query",
            "type": "button",
            "value": "query"
        },
        {
            "name": "category",
            "text": "Praise",
            "type": "button",
            "value": "praise",
            
        }
    ]
}];

/*
[
    {
        "text": "It is not a complaint.",
        "fallback": "You are unable to choose a category",
        "callback_id": "wopr_game",
        "color": "#3AA3E3",
        "attachment_type": "default",
        
    }
]
[
                    {
                        "fallback": "Required plain-text summary of the attachment.",
                        "color": "#36a64f",
                        "pretext": "Optional text that appears above the attachment block",
                        "author_name": "Bobby Tables",
                        "author_link": "http://flickr.com/bobby/",
                        "author_icon": "http://flickr.com/icons/bobby.jpg",
                        "title": "Slack API Documentation",
                        "title_link": "https://api.slack.com/",
                        "text": "Optional text that appears within the attachment",
                        "fields": [
                            {
                                "title": "Priority",
                                "value": "High",
                                "short": false
                            }
                        ],
                        "image_url": "http://my-website.com/path/to/image.jpg",
                        "thumb_url": "http://example.com/path/to/thumb.png",
                        "footer": "Slack API",
                        "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                        "ts": 123456789
                    }
                ]
*/

module.exports = {
    sendMessageToChannel: function(tweet){
        let channelName = tweet.tweetType;
        if(tweet.spam){
            channelName='SPAM'
        }
        if(tweet.productType=='GoPay'){
            channelName='gopay'
        }
        console.log(channelName);
        let message = tweet.productType + " : " + tweet.text;
        let blocks = []
        attachments[0].author_name = tweet.user.name;
        attachments[0].author_link = 'https://twitter.com/' + tweet.user.screen_name;
        attachments[0].thumb_url = tweet.user.profile_image_url;
        attachments[0].text = tweet.text;
        if(tweet.extended_entities){
            attachments.image_url = tweet.extended_entities.media[0].media_url_https;
        }
        console.log(orders)
        if(tweet.hasOwnProperty('orderId')){
            if(tweet.hasOwnProperty('orderId')){
                let order = orders[tweet.orderId];
                 blocks = [
                    {
                      "type": "section",
                      "text": {
                        "type": "mrkdwn",
                        "text": "Store: "+order.store
                      }
                    },
                    {
                      "type": "section",
                      "block_id": "section567",
                      "text": {
                        "type": "mrkdwn",
                        "text": "Amount: "+order.amount
                      }
                    },
                    {
                        "type": "section",
                      "block_id": "section568",
                      "text": {
                        "type": "mrkdwn",
                        "text": "Status: "+order.status
                      }
                    }
                    ]
                
            }

        }
        bot.postMessageToChannel(
            channelName,
            message,
            {
                "blocks":blocks,
                "attachments": attachments

            },
            async function(data){
                console.log("YAAAAAY"+JSON.stringify(data));
                tweet.ts = data.ts;
                await db.insertRecord(tweet, "tweet");
            }
        ).then(async function(error,result){
          console.log("result of postmessagetochannel: ");
          console.log(result);
          //tweet.ts = result.ts;
          //await db.insertRecord(tweet, "tweet");
        });
    }
}



bot.on('message', async (data) => {
    if(data.type !== 'message' || data.subtype) {
        return;
    }
   
    //reply to a thread
    if(data.thread_ts){
        let tweet = await db.getRecords({ts: data.thread_ts}, "tweet");
        console.log(tweet)
        helper.reply(data.text, tweet.record[0]);
        db.updateRecord({id: tweet.record[0].id }, {$set: {reply: data.text}}, "tweet")
    } else if(data.text.indexOf("@superservice")){
        //analyze data
        if(data.text.indexOf("past")){
            let tweets = await db.getRecords({"user.id" : 2722051105}, "tweet");
           let ch= await bot.getChannels()
           let channel = ch.channels.filter(c=> c.id == data.channel);
          // console.log(channel)
           // console.log(tweets.record);
            tweets = tweets.record;
            if(tweets.length >0 ){
                attachments = [{}];
                attachments[0].author_name = tweets[0].user.name;
                attachments[0].author_link = 'https://twitter.com/' + tweets[0].user.screen_name;
                attachments[0].thumb_url = tweets[0].user.profile_image_url;
                tweets.forEach(function(tweet){
                    let a = {
                        "title" : tweet.text,
                        "text" : tweet.reply 
                    }
                    attachments.push(a);
                });
                
                bot.postMessageToChannel(
                    channel[0].name,
                    "Past User History of "+ tweets[0].user.name,
                    {
                        "attachments": attachments
                    });
            } else {
                bot.postMessageToChannel(
                    data.channel,
                    "No past history");
            }
            

        }
    }
    
    console.log("on message");
    console.log(data);
})
  


function getUserHistory(){
   
}