const {Translate} = require('@google-cloud/translate').v2;
const automl = require('@google-cloud/automl');
const projectId = 'TEAM_BRAVE' 
var Twitter = require('twitter');
var config = require('./config.js');
const vision = require('@google-cloud/vision');

const productTypes = {
    GO_PAY: 'GoPay',
    GO_ACCOUNT: 'GoAccount',
    GO_TAXI: 'GoTaxi',
    GO_FOOD: 'GoFood',
    GO_JEK: 'GoJek'
}

const tweetTypes = {
    QUERY:'query',
    COMPLAIN:'complain',
    PRAISE:'praise',
    FEATURE:'feature'
}

const client = new automl.v1beta1.PredictionServiceClient({projectId:projectId,keyFilename:"teambrave-b2fa8bc85fba.json"});
const translate = new Translate({projectId:projectId,keyFilename:"teambrave-b2fa8bc85fba.json"});
const imageAnnotatorClient = new vision.ImageAnnotatorClient({projectId:projectId,keyFilename:"teambrave-b2fa8bc85fba.json"});
var T = new Twitter(config);
var _ = require('lodash');


module.exports.processImage = async function(imgUrl){
  const [result] = await imageAnnotatorClient.textDetection(imgUrl);
  const detections = result.textAnnotations;
  let indexOfOrder = _.findIndex(detections, function(o) { return o.description == 'Order'; });
  
  if(indexOfOrder < 0){
    indexOfOrder = _.findIndex(detections, function(o) { return o.description == 'Pesanan'; });
  }
  const orderId= detections[indexOfOrder+1].description;
  return orderId;
}
module.exports.translate = async function(text){
  const [translation] = await translate.translate(text, 'en')
       return translation;
  }
module.exports.reply = function(replyText,event){
      let name = event.user.screen_name
      let id = event.id;
      console.log(id);
      let reply = '@'+ name+' ' + replyText;
      // Post that tweet
      T.post('statuses/update', { status: reply, in_reply_to_status_id: id,in_reply_to_user_id:event.user.id}, tweeted);
  
     function tweeted(err, reply) {
            if (err) {
              console.log(err.message);
            } else {
              console.log('Tweeted: ' + reply.text);
            }
        }

    }

module.exports.classifyText=async function(text){
        console.log("CLASSIFY_TEXT:"+text)
        const projectId = "teambrave";
        const computeRegion = "us-central1";
        const modelId = "TCN7199237100816826368";
        const modelFullId = client.modelPath(projectId, computeRegion, modelId);
        // Set the payload by giving the content and type of the file.
          const payload = {
            textSnippet: {
              content: text,
              mimeType: `text/plain`,
            },
          };

          const [response] = await client.predict({
            name: modelFullId,
            payload: payload,
          });

          console.log(response);

          let prediction = {}
          if(response.payload.length >0 && response.payload[0].displayName == 'SPAM'){
              prediction.spam = true;
              return prediction;
          }
          if(response.payload.length >0  &&
                   productTypes.hasOwnProperty(response.payload[0].displayName)){
            prediction.productType = productTypes[response.payload[0].displayName];
          }
          else  if(
                  tweetTypes.hasOwnProperty(response.payload[0].displayName)){
                prediction.tweetType = tweetTypes[response.payload[0].displayName];
          }   
          if(response.payload.length >1 && tweetTypes.hasOwnProperty(response.payload[1].displayName)){
            prediction.tweetType = tweetTypes[response.payload[1].displayName];
          }
         else if(response.payload.length >1 && productTypes.hasOwnProperty(response.payload[1].displayName)){
            prediction.productType = productTypes[response.payload[1].displayName];
          }
         // if(response.payload.length >2 && tweetTypes.hasOwnProperty(response.payload[2].displayName)){
           // prediction.tweetType = response.payload[2].displayName;
          //}
           
          prediction.spam = false;
          return prediction;
         
    }
