require('dotenv').config()
const Console = require('./StyledConsole');
const TwitterAnalyzer = require('./TwitterAnalyzer'); 
const DictionaryAnalysis = require('./DictionaryAnalysis');

// checks for debugger
const argv = process.execArgv.join();
const isDebug = argv.includes('inspect') || argv.includes('debug');

// twitter client config from env
const ConsumerKey       = process.env.TW_CONSUMERKEY
    , ConsumerSecret    = process.env.TW_CONSUMERSECRET
    , AccessToken       = process.env.TW_ACCESSTOKEN
    , AccessTokenSecret = process.env.TW_ACCESSTOKENSECRET
    ;

// other configurations
const AnalysisLogInterval = parseInt(process.env.ANALYSIS_LOG_INTERVAL)
    , LocationBBox = process.env.LOCATION_BBOX
    , DebugPrintTweets = process.env.DEBUG_PRINT_TWEETS === "true" ? true : false
    ;

//dictionary analysis facilities
var dict = new DictionaryAnalysis();

let t = new TwitterAnalyzer(ConsumerKey, ConsumerSecret, AccessToken, AccessTokenSecret, true);
Console.log(Console.BgBlack, Console.BgRed, "Press CTRL+C to quit.");

// Write analysis results every "AnalysisLogInterval" milliseconds
setInterval(() => {
  dict.writeCountsFile('words-out.csv').then(() => {
    Console.log(Console.Dim, Console.FgRed, "Words statistics file written.", new Date());
  });
  t.writeCountsFile('hashtags-out.csv').then(() => {
    Console.log(Console.Dim, Console.FgRed, "Hashtags statistics file written.", new Date());
  });
}, AnalysisLogInterval);

//log errors on twitter analyzer
t.setLogHandler(err => {
  console.log("Twitter Analyzer error.", err.message, new Date());
});

// create a logger that behaves differently depending on 'DebugPrintTweets' parameter
var tweetLogger = DebugPrintTweets ? 
  (tweet, hashtags, tokens) => {
    //debug tweet information
    Console.log(Console.BgBlack, Console.FgWhite, '--------------------------------------------------')
    Console.log(Console.BgBlue, Console.FgWhite, tweet.user.screen_name, "["+tweet.user.lang+"]");
    Console.log(Console.BgBlack, Console.FgWhite, tweet.text);
    Console.log(Console.FgBlack, Console.FgWhite, Object.keys(tokens).reduce((str, k) => {
      return str + k + ": " + tokens[k] + "\r\n"
    }, ""));
    Console.log(Console.BgBlack, Console.FgRed, hashtags.join(', '));
  } : 
  () => {
    //print just a dot per tweet
    process.stdout.write(Console.BgBlack + Console.FgGreen + '.' + Console.Reset);
  };

//read dictionaries and start analysis
Promise
  .all([
    dict.loadFromFile("./assets/parole_uniche.txt"), 
    dict.loadStopwordsFromFile("assets/stopwords-it+en.txt")
  ])
  .then(() => {
    Console.log(Console.BgYellow, Console.FgBlack, "Words in dictionary: " + Object.keys(dict.terms).length);
    Console.log(Console.BgGreen, Console.FgBlack, "Stream watch starts.");
    let stream = t.watchStreamByLocation(LocationBBox, tweetLogger, dict);
  });
