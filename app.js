

var Twitter = require('twitter');
var config = require('./config.js');

var express = require('express');
var slack = require('./modules/slackConnect');
var db = require('./db');
var bodyParser = require('body-parser');
var streamFailed = false;

var T = new Twitter(config);
var helper = require('./helper')
var _ = require('lodash');
var app= new express();

var fs=require("fs");
var processedTweetsTxt=fs.readFileSync("processedTweets.txt", "utf8");
var processedTweetsArray = processedTweetsTxt.split(",");

// INCASE THE STREAM FAILS DURING DEMO 
var minutes = 0.5, the_interval = minutes * 60 * 1000;
setInterval(function() {
  console.log("I am doing my 0.5 minutes check");
  T.get('search/tweets', {q: '@superbravebot'}, async function(error, tweets, response) {
      if(tweets.statuses){
        console.log(tweets);
        var tweet = tweets.statuses[0]
        console.log(processedTweetsArray)
        if(!processedTweetsArray.includes(''+tweet.id)){
            console.log("yay, new tweet!")
            let translatedText = await helper.translate(tweet.text)
            let classificationOutput = await helper.classifyText(translatedText)
            if(tweet.extended_entities){
              var entity = _.find(tweet.extended_entities.media, function (x) { return x.media_url_https !="" });
              let orderId= await helper.processImage(entity.media_url_https);
              console.log(orderId);
              tweet.orderId = orderId;
            }
            tweet.productType = classificationOutput.productType;
            tweet.tweetType = classificationOutput.tweetType;
            tweet.spam = classificationOutput.spam;
            console.log(classificationOutput)
            slack.sendMessageToChannel(tweet);
            
            fs.appendFile('processedTweets.txt',tweet.id+",", function (err) {
              if (err) throw err;
              console.log('Saved!');
            });
            processedTweetsArray.push(''+tweet.id);

            console.log(classificationOutput)
            if(!classificationOutput.spam && !tweet.orderId &&tweet.tweetType=='complain'){
              helper.reply("Agen telah diberitahu. Silakan kirim nomor pesanan agar kami dapat membantu Anda lebih lanjut.",tweet);
            }
            else if(tweet.tweetType =='query' && tweet.productType=='GoAccount' ){
              helper.reply("Buka halaman akun saya di bawah bagian profil. Klik tombol lanjut. Anda akan melihat opsi untuk menonaktifkan",tweet);
            }
            else if(tweet.tweetType=='praise'){
              helper.reply("Serving you is a priority for us <3 Thanks for the support!",tweet);
            }
            else if(!classificationOutput.spam && tweet.orderId) {
              helper.reply("Kami akan segera menghubungi Anda!",tweet);
            }
            if(tweet.tweetType=='feature'){
              helper.reply("Thanks for your suggestion! We will work on it",tweet);
            }
      }    

  }
})
}, the_interval);




var stream =T.stream('statuses/filter', {track: '@superbravebot'});
stream.on('tweet', async function(tweet) {  
  console.log(JSON.stringify(tweet));
  if(!processedTweetsArray.includes(''+tweet.id)){
    console.log("yay, new tweet!")
    let translatedText = await helper.translate(tweet.text)
    let classificationOutput = await helper.classifyText(translatedText)
    if(tweet.extended_entities){
      var entity = _.find(tweet.extended_entities.media, function (x) { return x.media_url_https !="" });
      let orderId= await helper.processImage(entity.media_url_https);
      console.log(orderId);
      tweet.orderId = orderId;
    }
    tweet.productType = classificationOutput.productType;
    tweet.tweetType = classificationOutput.tweetType;
    tweet.spam = classificationOutput.spam;
    slack.sendMessageToChannel(tweet);
    
    fs.appendFile('processedTweets.txt',tweet.id+",", function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
    processedTweetsArray.push(''+tweet.id);

    console.log(classificationOutput)
    if(!classificationOutput.spam && !tweet.orderId &&tweet.tweetType=='complain'){
      helper.reply("Agen telah diberitahu. Silakan kirim nomor pesanan agar kami dapat membantu Anda lebih lanjut.",tweet);
    }
    else if(tweet.tweetType =='query' && tweet.productType=='GoAccount' ){
      helper.reply("Buka halaman akun saya di bawah bagian profil. Klik tombol lanjut. Anda akan melihat opsi untuk menonaktifkan",tweet);
    }
    else if(tweet.tweetType=='praise'){
      helper.reply("Serving you is a priority for us <3 Thanks for the support!",tweet);
    }
    else {
      helper.reply("Kami akan segera menghubungi Anda!",tweet);
    }
} 

  })



  stream.on('error', function(error) {
   console.log(error)
   streamFailed = true;
});

app.listen(3000)
 
  



app.post("/addReply", function(req, res) {
  console.log(req.body)
  tweet.insertReply(req.body, res);
  //NOTIFY user
});
